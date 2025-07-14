#!/bin/bash

# Daily Report Management System - Complete Test Suite
# This script runs all tests: unit tests (frontend & backend) and E2E tests

set -e

echo "🧪 Starting complete test suite for Daily Report Management System"
echo "================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    print_success "All dependencies are available"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Root dependencies (for E2E tests)
    print_status "Installing root dependencies..."
    npm ci
    
    # Frontend dependencies
    print_status "Installing frontend dependencies..."
    cd frontend && npm ci && cd ..
    
    # Backend dependencies
    print_status "Installing backend dependencies..."
    cd backend && npm ci && cd ..
    
    print_success "Dependencies installed"
}

# Run frontend unit tests
run_frontend_tests() {
    print_status "Running frontend unit tests..."
    
    cd frontend
    
    # Type checking
    print_status "Running TypeScript type check..."
    npm run type-check
    
    # Linting
    print_status "Running ESLint..."
    npm run lint
    
    # Unit tests with coverage
    print_status "Running unit tests with coverage..."
    VITE_USE_MOCK_SERVICE=true VITE_SKIP_AUTH=true npm run test:coverage
    
    cd ..
    print_success "Frontend tests completed"
}

# Run backend unit tests
run_backend_tests() {
    print_status "Running backend unit tests..."
    
    cd backend
    
    # Type checking
    print_status "Running TypeScript type check..."
    npm run type-check
    
    # Linting
    print_status "Running ESLint..."
    npm run lint
    
    # Unit tests with coverage
    print_status "Running unit tests with coverage..."
    NODE_ENV=test USE_MOCK_DATA=true npm run test:coverage
    
    cd ..
    print_success "Backend tests completed"
}

# Start Docker services for E2E tests
start_services() {
    print_status "Starting Docker services for E2E tests..."
    
    # Stop any existing containers
    docker-compose down > /dev/null 2>&1 || true
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Health check
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000 > /dev/null && curl -s http://localhost:3001/api/daily-reports/test > /dev/null; then
            print_success "Services are ready"
            return 0
        fi
        
        print_status "Waiting for services... (${attempt}/${max_attempts})"
        sleep 5
        ((attempt++))
    done
    
    print_error "Services failed to start within expected time"
    docker-compose logs
    exit 1
}

# Run E2E tests
run_e2e_tests() {
    print_status "Running E2E tests..."
    
    # Install Playwright browsers if not already installed
    print_status "Installing Playwright browsers..."
    npx playwright install --with-deps
    
    # Run E2E tests
    print_status "Executing E2E test suite..."
    npm run e2e
    
    print_success "E2E tests completed"
}

# Stop Docker services
stop_services() {
    print_status "Stopping Docker services..."
    docker-compose down
    print_success "Services stopped"
}

# Generate combined coverage report
generate_coverage_report() {
    print_status "Generating combined coverage report..."
    
    # Create coverage directory if it doesn't exist
    mkdir -p coverage
    
    # Copy coverage reports
    if [ -d "frontend/coverage" ]; then
        cp -r frontend/coverage coverage/frontend
    fi
    
    if [ -d "backend/coverage" ]; then
        cp -r backend/coverage coverage/backend
    fi
    
    print_success "Coverage reports available in ./coverage directory"
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    stop_services
}

# Main execution
main() {
    # Set up cleanup trap
    trap cleanup EXIT
    
    # Start timestamp
    start_time=$(date +%s)
    
    # Run all test phases
    check_dependencies
    install_dependencies
    
    # Unit tests (can run in parallel)
    print_status "Phase 1: Unit Tests"
    run_frontend_tests &
    frontend_pid=$!
    
    run_backend_tests &
    backend_pid=$!
    
    # Wait for both unit test suites to complete
    wait $frontend_pid
    frontend_result=$?
    
    wait $backend_pid
    backend_result=$?
    
    if [ $frontend_result -ne 0 ] || [ $backend_result -ne 0 ]; then
        print_error "Unit tests failed"
        exit 1
    fi
    
    print_success "All unit tests passed"
    
    # E2E tests
    print_status "Phase 2: E2E Tests"
    start_services
    run_e2e_tests
    
    # Generate reports
    generate_coverage_report
    
    # End timestamp and duration
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    print_success "All tests completed successfully! 🎉"
    print_status "Total execution time: ${duration} seconds"
    
    # Summary
    echo ""
    echo "Test Summary:"
    echo "=============="
    echo "✅ Frontend unit tests: PASSED"
    echo "✅ Backend unit tests: PASSED"
    echo "✅ E2E tests: PASSED"
    echo ""
    echo "Coverage reports available in:"
    echo "- Frontend: ./coverage/frontend/"
    echo "- Backend: ./coverage/backend/"
    echo ""
    echo "E2E test reports available in:"
    echo "- ./playwright-report/"
}

# Handle command line arguments
case "${1:-}" in
    --frontend-only)
        print_status "Running frontend tests only..."
        check_dependencies
        cd frontend && npm ci && cd ..
        run_frontend_tests
        ;;
    --backend-only)
        print_status "Running backend tests only..."
        check_dependencies
        cd backend && npm ci && cd ..
        run_backend_tests
        ;;
    --e2e-only)
        print_status "Running E2E tests only..."
        check_dependencies
        npm ci
        start_services
        run_e2e_tests
        ;;
    --help|-h)
        echo "Usage: $0 [OPTION]"
        echo ""
        echo "Options:"
        echo "  --frontend-only    Run only frontend unit tests"
        echo "  --backend-only     Run only backend unit tests"
        echo "  --e2e-only         Run only E2E tests"
        echo "  --help, -h         Show this help message"
        echo ""
        echo "With no options, runs all tests (frontend, backend, and E2E)"
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac