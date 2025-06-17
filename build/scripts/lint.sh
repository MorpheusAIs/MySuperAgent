#!/bin/bash
# Run all linters on Python files in the project including submodules

set -e  # Exit immediately if a command exits with a non-zero status

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get the root directory (parent of build/)
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

# Get the project root directory
PROJECT_ROOT="$ROOT_DIR/.."

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Python 3.12 specifically, fallback to system python
if command_exists /opt/homebrew/opt/python@3.12/bin/python3.12; then
    PYTHON_CMD="/opt/homebrew/opt/python@3.12/bin/python3.12"
    PIP_CMD="/opt/homebrew/opt/python@3.12/bin/pip3.12"
elif command_exists python3.12; then
    PYTHON_CMD="python3.12"
    PIP_CMD="pip3.12"
elif command_exists python3; then
    PYTHON_CMD="python3"
    # Check for pip
    if command_exists pip3; then
        PIP_CMD="pip3"
    elif command_exists pip; then
        PIP_CMD="pip"
    else
        echo -e "${RED}Error: pip is not installed. Please install pip.${NC}"
        exit 1
    fi
elif command_exists python; then
    PYTHON_CMD="python"
    PIP_CMD="pip"
else
    echo -e "${RED}Error: Python is not installed.${NC}"
    exit 1
fi

print_header "Checking/Installing Linting Tools"
echo "Using Python: $($PYTHON_CMD --version)"
echo "Using pip: $($PIP_CMD --version)"

# Create virtual environment to avoid externally-managed-environment error
VENV_DIR="$PROJECT_ROOT/.lint_venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment for linting..."
    $PYTHON_CMD -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Install linting tools if needed
echo "Installing linting tools..."
pip install flake8==7.0.0 black==23.12.1 isort==5.13.2

# Create a temporary file for capturing linting issues
LINT_ISSUES=$(mktemp)

# Change to the project root directory to match GitHub Actions behavior
cd "$PROJECT_ROOT"

# Run Black
print_header "Running Black"
if ! black --line-length=120 . 2>&1 | tee -a "$LINT_ISSUES"; then
    BLACK_DIFF_ISSUES=1
fi

# Check formatting with Black
print_header "Checking formatting with Black"
if ! black --check --line-length=120 . 2>&1 | tee -a "$LINT_ISSUES"; then
    BLACK_CHECK_ISSUES=1
fi

# Run isort
print_header "Running isort"
if ! isort --profile black --line-length 120 . 2>&1 | tee -a "$LINT_ISSUES"; then
    ISORT_DIFF_ISSUES=1
fi

# Check imports with isort
print_header "Checking imports with isort"
if ! isort --profile black --line-length 120 --check . 2>&1 | tee -a "$LINT_ISSUES"; then
    ISORT_CHECK_ISSUES=1
fi

# Run flake8
print_header "Running flake8"
if ! flake8 --max-line-length=120 . 2>&1 | tee -a "$LINT_ISSUES"; then
    FLAKE8_ISSUES=1
fi

# Run JavaScript/TypeScript linters if package.json exists
print_header "Checking for JavaScript/TypeScript linters"
if [ -f package.json ]; then
    echo "Found package.json, installing JS dependencies..."
    if command_exists npm; then
        npm ci
        # Run eslint if configured in package.json
        if grep -q '"eslint"' package.json; then
            echo "Running eslint..."
            npm run lint
            if [ $? -ne 0 ]; then
                JS_ISSUES=1
            fi
        else
            echo "No eslint configuration found in package.json"
        fi
    else
        echo -e "${YELLOW}Warning: npm not found, skipping JavaScript/TypeScript linting${NC}"
    fi
else
    echo "No package.json found, skipping JavaScript/TypeScript linting"
fi

# Deactivate virtual environment
deactivate

# Check if any issues were found
print_header "Summary"
if [ -n "$BLACK_DIFF_ISSUES" ] || [ -n "$BLACK_CHECK_ISSUES" ] || [ -n "$ISORT_DIFF_ISSUES" ] || [ -n "$ISORT_CHECK_ISSUES" ] || [ -n "$FLAKE8_ISSUES" ] || [ -n "$JS_ISSUES" ]; then
    echo -e "${YELLOW}Linting issues were found. See above for details.${NC}"
    
    # Ask if user wants to automatically fix formatting issues
    if [ -n "$BLACK_CHECK_ISSUES" ] || [ -n "$ISORT_CHECK_ISSUES" ]; then
        echo -ne "\n${BLUE}Would you like to automatically fix formatting issues? [y/N] ${NC}"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            # Reactivate venv for formatting
            source "$VENV_DIR/bin/activate"
            
            echo "Formatting Python files with Black..."
            black --line-length=120 .
            
            echo "Sorting imports with isort..."
            isort --profile black --line-length 120 .
            
            deactivate
            echo -e "${GREEN}Formatting complete!${NC}"
        else
            echo "Skipping automatic formatting."
        fi
    fi
    
    # Remind about flake8 issues
    if [ -n "$FLAKE8_ISSUES" ]; then
        echo -e "\n${YELLOW}Note: flake8 issues must be fixed manually. They cannot be auto-fixed.${NC}"
    fi
    
    exit 1
else
    echo -e "${GREEN}All linting checks passed successfully!${NC}"
    exit 0
fi