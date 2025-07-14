# Asana Task Debug Guide

This guide shows how to debug why a specific Asana task (ID: 1210783860169047) is not appearing in the search results for today (2025-07-14).

## New Debug Functionality Added

### 1. Enhanced Debug Method in AsanaService
- Added `debugTask()` method to get comprehensive task information
- Analyzes task creation date, modification date, created_by, and stories
- Checks all search methods to understand why task is not included

### 2. New Debug Endpoint
- **Endpoint**: `GET /api/asana/tasks/debug`
- **Parameters**: 
  - `workspaceGid` (required): The workspace GID
  - `taskGid` (required): The task ID to debug (1210783860169047)
  - `date` (optional): Target date, defaults to today

### 3. Enhanced Logging in getTasksInvolvedToday
- Added detailed logging for each task verification step
- Shows creation/modification date checks
- Displays story analysis for each task

## How to Use

### Step 1: Get your workspace GID
First, get your workspace GID:
```bash
curl -X GET "http://localhost:3001/api/asana/workspaces" \
  -H "Content-Type: application/json"
```

### Step 2: Debug the specific task
Replace `YOUR_WORKSPACE_GID` with the actual workspace GID:
```bash
curl -X GET "http://localhost:3001/api/asana/tasks/debug?workspaceGid=YOUR_WORKSPACE_GID&taskGid=1210783860169047&date=2025-07-14" \
  -H "Content-Type: application/json"
```

### Step 3: Check the backend logs
Monitor the backend logs to see detailed analysis:
```bash
docker-compose logs -f backend
```

## What the Debug Information Shows

The debug response includes:
- **Task Details**: Name, creation date, modification date, created_by, assignee, etc.
- **Stories Analysis**: All activities/stories for the task
- **Search Results**: Whether the task appears in different search methods
- **Analysis**: Why the task is or isn't included in search results

## Expected Analysis for Task 1210783860169047

The debug will check:
1. **Creation Date**: When the task was created and if it was today (2025-07-14)
2. **Modification Date**: When the task was last modified and if it was today
3. **Created By**: Who created the task (must be you to appear in "involved today")
4. **Stories**: Your activities on the task for the target date
5. **Search Coverage**: Whether the task appears in different search methods

## Common Reasons Why Tasks Don't Appear

1. **Not Created by You**: The task was created by someone else
2. **Not Modified Today**: The task wasn't modified on the target date
3. **No Activities**: You didn't perform any activities on the task today
4. **Outside Search Scope**: The task doesn't appear in "my tasks" or "recent tasks" queries
5. **Permission Issues**: Limited access to task details or stories

## Example Expected Output

```json
{
  "data": {
    "taskGid": "1210783860169047",
    "targetDate": "2025-07-14",
    "taskDetails": {
      "name": "Task Name",
      "created_at": "2025-01-15T10:00:00.000Z",
      "modified_at": "2025-07-14T14:30:00.000Z",
      "created_by": { "gid": "different_user_id", "name": "Other User" }
    },
    "analysis": {
      "createdByMe": false,
      "createdOnTargetDate": false,
      "modifiedOnTargetDate": true,
      "myStoriesOnTargetDate": [],
      "reasonNotIncluded": [
        "自分が作成したタスクではない",
        "対象日に自分が行った活動がない"
      ]
    }
  }
}
```

This debug information will help understand exactly why the task isn't appearing in the `getTasksInvolvedToday` results.