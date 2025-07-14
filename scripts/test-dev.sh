#!/bin/bash

# Daily Report Management System - Development Test Script
# Quick test script for development with watch mode and instant feedback

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Quick frontend tests
test_frontend() {
    print_status "Running frontend tests in watch mode..."
    cd frontend
    VITE_USE_MOCK_SERVICE=true VITE_SKIP_AUTH=true npm run test:mock
    cd ..
}

# Quick backend tests
test_backend() {
    print_status "Running backend tests in watch mode..."
    cd backend
    NODE_ENV=test USE_MOCK_DATA=true npm run test:watch
    cd ..
}

# Run type checks
type_check() {
    print_status "Running type checks..."
    
    print_status "Checking frontend types..."
    cd frontend && npm run type-check && cd ..
    
    print_status "Checking backend types..."
    cd backend && npm run type-check && cd ..
    
    print_success "Type checks completed"
}

# Run linters
lint() {
    print_status "Running linters..."
    
    print_status "Linting frontend..."
    cd frontend && npm run lint && cd ..
    
    print_status "Linting backend..."
    cd backend && npm run lint && cd ..
    
    print_success "Linting completed"
}

# Quick test run (no watch)
quick_test() {
    print_status "Running quick tests..."
    
    print_status "Frontend tests..."
    cd frontend
    VITE_USE_MOCK_SERVICE=true VITE_SKIP_AUTH=true npm run test
    cd ..
    
    print_status "Backend tests..."
    cd backend
    NODE_ENV=test USE_MOCK_DATA=true npm run test
    cd ..
    
    print_success "Quick tests completed"
}

# Show help
show_help() {
    echo "Daily Report Management System - Development Test Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  frontend       Run frontend tests in watch mode"
    echo "  backend        Run backend tests in watch mode"
    echo "  types          Run TypeScript type checking"
    echo "  lint           Run ESLint on all code"
    echo "  quick          Run all tests once (no watch mode)"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 frontend    # Watch frontend tests"
    echo "  $0 quick       # Run all tests once"
    echo "  $0 types       # Check TypeScript types"
}

# Main execution
case "${1:-help}" in
    frontend)
        test_frontend
        ;;
    backend)
        test_backend
        ;;
    types)
        type_check
        ;;
    lint)
        lint
        ;;
    quick)
        quick_test
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        echo ""
        show_help
        exit 1
        ;;
esac