"""
Test script for MOR LLM implementation.

This script provides basic testing functionality for the MORLLM class
to verify it works correctly with the MOR API.
"""

from src.services.api_gateway.mor_llm import MORLLM


def test_basic_call():
    """Test basic LLM call functionality."""
    print("Testing MOR LLM basic call...")

    # Initialize LLM
    llm = MORLLM()

    # Test simple string input
    try:
        response = llm.call("Hello! How are you today?")
        print("✓ String input test passed")
        print(f"Response: {response[:100]}...")

    except Exception as e:
        print(f"✗ String input test failed: {e}")
        return False

    # Test message format input
    try:
        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "What is 2+2?"},
        ]
        response = llm.call(messages)
        print("✓ Message format test passed")
        print(f"Response: {response[:100]}...")

    except Exception as e:
        print(f"✗ Message format test failed: {e}")
        return False

    return True


def test_llm_properties():
    """Test LLM property methods."""
    print("\nTesting LLM properties...")

    llm = MORLLM()

    # Test properties
    print(f"Model: {llm.model}")
    print(f"Temperature: {llm.temperature}")
    print(f"Supports function calling: {llm.supports_function_calling()}")
    print(f"Supports stop words: {llm.supports_stop_words()}")
    print(f"Context window size: {llm.get_context_window_size()}")
    print(f"String representation: {str(llm)}")

    return True


def test_crewai_integration():
    """Test basic CrewAI integration (if CrewAI is available)."""
    print("\nTesting CrewAI integration...")

    try:
        from crewai import Agent, Crew, Task

        # Create LLM
        llm = MORLLM()

        # Create agent
        agent = Agent(
            role="Test Assistant",
            goal="Answer simple questions",
            backstory="You are a test assistant designed to verify LLM functionality.",
            llm=llm,
        )

        # Create task
        task = Task(
            description="Say hello and introduce yourself",
            expected_output="A friendly greeting and introduction",
            agent=agent,
        )

        # Create and run crew
        crew = Crew(agents=[agent], tasks=[task])
        result = crew.kickoff()

        print("✓ CrewAI integration test passed")
        print(f"Result: {str(result)[:200]}...")

        return True

    except ImportError:
        print("⚠ CrewAI not available, skipping integration test")
        return True
    except Exception as e:
        print(f"✗ CrewAI integration test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 50)
    print("MOR LLM Test Suite")
    print("=" * 50)

    tests = [test_basic_call, test_llm_properties, test_crewai_integration]

    passed = 0
    total = len(tests)

    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with exception: {e}")

    print("\n" + "=" * 50)
    print(f"Test Results: {passed}/{total} tests passed")
    print("=" * 50)

    return passed == total


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
