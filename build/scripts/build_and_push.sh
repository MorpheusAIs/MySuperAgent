#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Get the root directory (parent of build/)
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Set AWS Region
AWS_REGION="us-west-1"

# AWS ECR Repository URL
AWS_ACCOUNT_ID="816069170416"
ECR_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Define image names and their corresponding directories
IMAGE_NAMES=("mysuperagent-agents" "mysuperagent-frontend")
IMAGE_DIRS=("$ROOT_DIR/../submodules/agents" "$ROOT_DIR/../submodules/frontend")

# Function to handle errors
handle_error() {
    echo "ERROR: $1"
    exit 1
}

# Function to display usage
show_usage() {
    echo "Usage: $0 [OPTION]"
    echo "Options:"
    echo "  --agents    Build and push only the agents image"
    echo "  --frontend  Build and push only the frontend image"
    echo "  --all       Build and push all images (default if no option is specified)"
    echo "  --help      Display this help message"
    exit 0
}

# Parse command line arguments
BUILD_AGENTS=false
BUILD_FRONTEND=false

if [ $# -eq 0 ]; then
    # Default: build all
    BUILD_AGENTS=true
    BUILD_FRONTEND=true
else
    case "$1" in
        --agents)
            BUILD_AGENTS=true
            ;;
        --frontend)
            BUILD_FRONTEND=true
            ;;
        --all)
            BUILD_AGENTS=true
            BUILD_FRONTEND=true
            ;;
        --help)
            show_usage
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            ;;
    esac
fi

# Authenticate with AWS ECR
echo "Logging into AWS ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL || handle_error "Failed to authenticate with AWS ECR"

# Function to build and push an image
build_and_push_image() {
    local image_idx=$1
    local image_name="${IMAGE_NAMES[$image_idx]}"
    local image_dir="${IMAGE_DIRS[$image_idx]}"
    
    echo "Building $image_name in directory $image_dir..."
    
    # Check if repository exists, create if it doesn't
    echo "Checking if repository $image_name exists..."
    if ! aws ecr describe-repositories --repository-names "$image_name" --region $AWS_REGION &> /dev/null; then
        echo "Creating repository $image_name..."
        aws ecr create-repository --repository-name "$image_name" --region $AWS_REGION || handle_error "Failed to create repository $image_name"
    else
        echo "Repository $image_name already exists"
    fi
    
    # Navigate to the project directory
    cd "$image_dir" || handle_error "Failed to navigate to $image_dir"

    # Build the Docker image
    if [ "$image_name" == "mysuperagent-agents" ]; then
        docker build -t "$image_name" -f build/Dockerfile . || handle_error "Failed to build $image_name"
    else
        docker build -t "$image_name" . || handle_error "Failed to build $image_name"
    fi
    
    # Navigate back to the root directory
    cd - > /dev/null

    # Tag the image
    echo "Tagging $image_name..."
    docker tag "$image_name:latest" "$ECR_URL/$image_name:latest" || handle_error "Failed to tag $image_name"

    # Push the image with retry logic
    echo "Pushing $image_name to ECR..."
    
    # Set retry parameters
    MAX_RETRIES=3
    RETRY_COUNT=0
    PUSH_SUCCESS=false
    
    while [ $RETRY_COUNT -lt $MAX_RETRIES ] && [ "$PUSH_SUCCESS" = false ]; do
        if [ $RETRY_COUNT -gt 0 ]; then
            echo "Retry attempt $RETRY_COUNT for pushing $image_name..."
            # Small delay before retry
            sleep 5
        fi
        
        # Push with a background process and kill after timeout
        push_pid=""
        push_output_file=$(mktemp)
        
        # Start the push in background and capture its PID
        docker push "$ECR_URL/$image_name:latest" > "$push_output_file" 2>&1 &
        push_pid=$!
        
        # Wait for push to complete with timeout
        push_timeout=300
        elapsed=0
        push_status=0
        
        while kill -0 $push_pid 2>/dev/null && [ $elapsed -lt $push_timeout ]; do
            sleep 5
            elapsed=$((elapsed + 5))
        done
        
        # Check if process is still running after timeout
        if kill -0 $push_pid 2>/dev/null; then
            echo "Push operation timed out after ${push_timeout}s"
            kill -9 $push_pid 2>/dev/null || true
            push_status=1
        else
            # Process completed, get its exit status
            wait $push_pid
            push_status=$?
        fi
        
        # Check output for success
        cat "$push_output_file"
        
        if [ $push_status -eq 0 ] && ! grep -q "error\|fail\|timeout" "$push_output_file"; then
            rm -f "$push_output_file"
            PUSH_SUCCESS=true
            echo "$image_name pushed successfully!"
        else
            RETRY_COUNT=$((RETRY_COUNT + 1))
            
            if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
                handle_error "Failed to push $image_name after $MAX_RETRIES attempts. Check network connection to ECR."
            else
                echo "Push attempt failed. Will retry ($RETRY_COUNT/$MAX_RETRIES)..."
            fi
        fi
        
        # Clean up temp file if it still exists
        [ -f "$push_output_file" ] && rm -f "$push_output_file"
    done
}

# Build and push selected images
echo "Starting build and push process..."

if [ "$BUILD_AGENTS" = true ]; then
    build_and_push_image 0
fi

if [ "$BUILD_FRONTEND" = true ]; then
    build_and_push_image 1
fi

echo "All selected images have been built and pushed successfully!"