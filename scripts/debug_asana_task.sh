#!/bin/bash

# Debug script for Asana task 1210783860169047
# This script tests the new debug functionality

echo "🔍 Debugging Asana Task 1210783860169047"
echo "========================================"

# Configuration
TASK_ID="1210783860169047"
TARGET_DATE="2025-07-14"
BASE_URL="http://localhost:3001/api/asana"

echo "📋 Task ID: $TASK_ID"
echo "📅 Target Date: $TARGET_DATE"
echo "🌐 Base URL: $BASE_URL"
echo ""

# Step 1: Get workspaces
echo "Step 1: Getting workspaces..."
echo "curl -X GET \"$BASE_URL/workspaces\""
echo ""

WORKSPACES_RESPONSE=$(curl -s -X GET "$BASE_URL/workspaces" -H "Content-Type: application/json")
echo "Workspaces Response:"
echo $WORKSPACES_RESPONSE | jq '.' 2>/dev/null || echo $WORKSPACES_RESPONSE
echo ""

# Extract workspace GID (assuming first workspace)
WORKSPACE_GID=$(echo $WORKSPACES_RESPONSE | jq -r '.data[0].gid' 2>/dev/null)

if [ "$WORKSPACE_GID" = "null" ] || [ -z "$WORKSPACE_GID" ]; then
    echo "❌ Failed to get workspace GID. Please check if the API is running and you have access."
    exit 1
fi

echo "✅ Using Workspace GID: $WORKSPACE_GID"
echo ""

# Step 2: Debug the specific task
echo "Step 2: Debugging task $TASK_ID..."
DEBUG_URL="$BASE_URL/tasks/debug?workspaceGid=$WORKSPACE_GID&taskGid=$TASK_ID&date=$TARGET_DATE"
echo "curl -X GET \"$DEBUG_URL\""
echo ""

DEBUG_RESPONSE=$(curl -s -X GET "$DEBUG_URL" -H "Content-Type: application/json")
echo "Debug Response:"
echo $DEBUG_RESPONSE | jq '.' 2>/dev/null || echo $DEBUG_RESPONSE
echo ""

# Step 3: Also test the normal "involved today" endpoint for comparison
echo "Step 3: Testing normal 'involved today' endpoint for comparison..."
INVOLVED_URL="$BASE_URL/tasks/involved-today?workspaceGid=$WORKSPACE_GID&date=$TARGET_DATE"
echo "curl -X GET \"$INVOLVED_URL\""
echo ""

INVOLVED_RESPONSE=$(curl -s -X GET "$INVOLVED_URL" -H "Content-Type: application/json")
echo "Involved Today Response:"
echo $INVOLVED_RESPONSE | jq '.' 2>/dev/null || echo $INVOLVED_RESPONSE
echo ""

# Step 4: Check if task is in the involved today results
echo "Step 4: Checking if task $TASK_ID is in involved today results..."
TASK_FOUND=$(echo $INVOLVED_RESPONSE | jq -r ".data[] | select(.gid == \"$TASK_ID\") | .gid" 2>/dev/null)

if [ "$TASK_FOUND" = "$TASK_ID" ]; then
    echo "✅ Task $TASK_ID WAS found in involved today results"
else
    echo "❌ Task $TASK_ID was NOT found in involved today results"
fi
echo ""

# Step 5: Summary
echo "Summary:"
echo "========"
echo "🔍 Task ID: $TASK_ID"
echo "📅 Target Date: $TARGET_DATE"
echo "🗂️ Workspace: $WORKSPACE_GID"
echo "📋 Found in involved today: $([ "$TASK_FOUND" = "$TASK_ID" ] && echo "YES" || echo "NO")"
echo ""
echo "💡 Check the backend logs for detailed analysis:"
echo "   docker-compose logs -f backend"
echo ""
echo "📚 For more information, see: debug_asana_task.md"