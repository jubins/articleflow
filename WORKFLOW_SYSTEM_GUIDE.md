# ArticleFlow Workflow System

## Overview

The Workflow System enables users to create reusable article generation pipelines with two input modes:
1. **Google Sheets** - Read prompts from a Google Sheet
2. **Manual List** - Define prompts directly in the workflow

## Key Features

✅ **Multiple Workflows**: Create unlimited workflows with different configurations
✅ **Flexible Input**: Google Sheets OR manual prompt lists
✅ **Batch Processing**: Generate multiple articles from one workflow
✅ **Rich Preview**: Preview both HTML and Markdown before saving
✅ **Progress Tracking**: Track each article's generation status
✅ **Reusable**: Run workflows multiple times

## Database Schema

### Completed Migrations

#### `workflows` Table
Stores workflow configurations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique workflow ID |
| user_id | UUID | Owner user ID |
| name | TEXT | Workflow name |
| description | TEXT | Optional description |
| source_type | TEXT | 'google_sheets' or 'manual' |
| google_sheets_id | TEXT | Google Sheets ID (if source_type = google_sheets) |
| sheet_name | TEXT | Sheet tab name (default: 'generator') |
| title_column | TEXT | Column letter for titles (default: 'A') |
| prompt_column | TEXT | Column letter for prompts (default: 'B') |
| file_id_column | TEXT | Column letter for file IDs (default: 'C') |
| ai_provider | TEXT | 'claude' or 'gemini' |
| target_platform | TEXT | 'medium', 'devto', 'dzone', or 'all' |
| word_count | INTEGER | Target word count |
| article_template | TEXT | Custom template (optional) |
| create_google_doc | BOOLEAN | Auto-create Google Docs |
| save_markdown | BOOLEAN | Auto-save markdown |
| is_active | BOOLEAN | Workflow active status |
| last_run_at | TIMESTAMPTZ | Last execution time |
| total_articles_generated | INTEGER | Total articles from this workflow |

#### `workflow_items` Table
Stores manual prompt lists for workflows.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique item ID |
| workflow_id | UUID | Parent workflow |
| title | TEXT | Article title |
| prompt | TEXT | Generation prompt |
| file_id | TEXT | Custom file ID (optional) |
| position | INTEGER | Order in list |
| status | TEXT | 'pending', 'processing', 'completed', 'failed' |
| article_id | UUID | Generated article (once created) |
| error_message | TEXT | Error if failed |
| processed_at | TIMESTAMPTZ | When processed |

#### Updated `articles` Table
Added `workflow_id` column to track which workflow generated the article.

## Architecture

### Workflow Types

#### 1. Google Sheets Workflow
```
User creates workflow
     ↓
Configures Google Sheets ID and columns
     ↓
Runs workflow
     ↓
System reads from Google Sheets (user's own account via OAuth)
     ↓
Generates articles for each row
     ↓
Saves to database
```

#### 2. Manual List Workflow
```
User creates workflow
     ↓
Adds manual items (title + prompt pairs)
     ↓
Runs workflow
     ↓
System processes each item
     ↓
Generates articles
     ↓
Saves to database
```

## Implementation Status

### ✅ Completed

1. **Database Schema** (`supabase/migrations/20241217_add_workflows.sql`)
   - workflows table with RLS
   - workflow_items table with RLS
   - Updated articles table
   - Proper indexes and constraints

2. **TypeScript Types** (`lib/types/database.ts`)
   - Workflow and WorkflowItem types
   - Insert/Update types
   - Enum types for validation

### 🚧 In Progress / TODO

#### API Routes Needed

1. **Workflow CRUD** (`app/api/workflows/route.ts`)
   ```typescript
   GET  /api/workflows          // List user's workflows
   POST /api/workflows          // Create new workflow
   GET  /api/workflows/[id]     // Get workflow details
   PUT  /api/workflows/[id]     // Update workflow
   DELETE /api/workflows/[id]   // Delete workflow
   ```

2. **Workflow Items** (`app/api/workflows/[id]/items/route.ts`)
   ```typescript
   GET  /api/workflows/[id]/items     // List workflow items
   POST /api/workflows/[id]/items     // Add item
   PUT  /api/workflows/[id]/items/[itemId]  // Update item
   DELETE /api/workflows/[id]/items/[itemId] // Delete item
   ```

3. **Workflow Execution** (`app/api/workflows/[id]/run/route.ts`)
   ```typescript
   POST /api/workflows/[id]/run  // Execute workflow

   Returns: {
     workflow_run_id: string,
     items: Array<{
       item_id: string,
       title: string,
       status: 'pending' | 'processing' | 'completed' | 'failed',
       article_id?: string,
       error?: string
     }>
   }
   ```

#### Frontend Pages

1. **Workflows List** (`app/workflows/page.tsx`)
   - List all workflows
   - Create new workflow button
   - Edit/delete/run actions
   - Show last run time and article count

2. **Workflow Creator** (`app/workflows/new/page.tsx`)
   - Two-tab interface: Google Sheets | Manual List
   - Form for workflow settings
   - Manual item list editor
   - Save workflow

3. **Workflow Runner** (`app/workflows/[id]/run/page.tsx`)
   - Shows workflow details
   - Lists all items to be processed
   - "Generate All" button
   - Real-time progress tracking
   - Preview each article before saving

4. **Article Preview** (`app/workflows/[id]/preview/[itemId]/page.tsx`)
   - Rich text editor view (HTML)
   - Markdown editor view
   - Side-by-side comparison
   - Edit before saving
   - Save/Discard buttons

#### Components Needed

1. **Rich Text Editor** (`components/RichTextEditor.tsx`)
   ```bash
   npm install react-quill
   npm install @types/react-quill --save-dev
   ```
   - WYSIWYG editor for HTML content
   - Toolbar with formatting options

2. **Markdown Editor** (`components/MarkdownEditor.tsx`)
   - Simple textarea with markdown syntax highlighting
   - Optional: Install `react-markdown` for live preview

3. **Workflow Form** (`components/WorkflowForm.tsx`)
   - Input source selector (Google Sheets / Manual)
   - Conditional rendering based on source
   - Google Sheets configuration fields
   - Manual items list editor
   - AI provider selection
   - Platform selection

4. **Progress Tracker** (`components/WorkflowProgress.tsx`)
   - Shows generation progress
   - Item-by-item status
   - Error handling display

#### Service Updates

1. **Article Generator** (`lib/services/article-generator.ts`)
   - Add HTML output support
   - Return both markdown and HTML
   ```typescript
   interface GeneratedArticle {
     title: string
     content_markdown: string  // Existing
     content_html: string       // NEW
     description: string
     tags: string[]
     // ...
   }
   ```

2. **Workflow Service** (`lib/services/workflow.ts` - NEW)
   - Read items from Google Sheets (using OAuth)
   - Execute workflow
   - Process items sequentially or in parallel
   - Update item statuses

## Usage Flow

### Creating a Workflow

```typescript
// Example: Google Sheets Workflow
const workflow = {
  name: "Tech Blog Articles",
  source_type: "google_sheets",
  google_sheets_id: "1glBRMfYHBR64...",
  sheet_name: "generator",
  title_column: "A",  // Topics column
  prompt_column: "B",  // Prompt column
  file_id_column: "C", // FileId column
  ai_provider: "gemini",
  target_platform: "all",
  word_count: 2000,
  create_google_doc: true,
  save_markdown: true
}

// Create via API
POST /api/workflows
Body: workflow
```

```typescript
// Example: Manual List Workflow
const workflow = {
  name: "Product Launch Articles",
  source_type: "manual",
  ai_provider: "claude",
  target_platform: "medium",
  word_count: 1500,
  items: [
    {
      title: "Introducing Our New Feature",
      prompt: "Write an announcement article about...",
      position: 0
    },
    {
      title: "How to Use the New Feature",
      prompt: "Write a tutorial on using...",
      position: 1
    }
  ]
}

POST /api/workflows
Body: workflow
```

### Running a Workflow

```typescript
POST /api/workflows/{workflow_id}/run

// System will:
1. Load workflow config
2. Get items (from Sheets OR manual list)
3. For each item:
   a. Generate article (markdown + HTML)
   b. Show preview to user
   c. User can edit/approve/reject
   d. Save approved articles
   e. Create Google Doc if enabled
   f. Upload markdown if enabled
4. Update workflow statistics
```

### Preview and Save

```typescript
// User sees preview with two views:
1. Rich Text View (HTML) - editable WYSIWYG
2. Markdown View - editable markdown

// User can:
- Switch between views
- Edit content in either format
- Save to database
- Discard and regenerate
- Skip this article
```

## Migration Steps

### 1. Run Database Migration

In Supabase SQL Editor:
```sql
-- File: supabase/migrations/20241217_add_workflows.sql
-- Run the entire migration file
```

### 2. Install Dependencies

```bash
# Rich text editor
npm install react-quill
npm install @types/react-quill --save-dev

# Optional: Markdown preview
npm install react-markdown remark-gfm
```

### 3. Implement API Routes

Create the API files mentioned in the "API Routes Needed" section.

### 4. Build UI Components

Create the frontend pages and components listed above.

### 5. Update Navigation

Add "Workflows" to the navigation menu.

## Example User Journey

### Scenario 1: Google Sheets Workflow

1. User goes to **Workflows** page
2. Clicks "Create Workflow"
3. Selects "Google Sheets" as source
4. Enters:
   - Workflow name: "Weekly Tech Articles"
   - Google Sheets ID: `1glBRMfYHBR64...`
   - Columns: A (title), B (prompt), C (file ID)
   - AI: Gemini
   - Platform: Dev.to
5. Saves workflow
6. Clicks "Run Workflow"
7. System reads 10 rows from Sheet
8. Generates first article
9. Shows preview (HTML + Markdown)
10. User approves
11. Article saved, Google Doc created, Markdown uploaded
12. Repeats for remaining 9 articles
13. Workflow complete!

### Scenario 2: Manual List Workflow

1. User goes to **Workflows** page
2. Clicks "Create Workflow"
3. Selects "Manual List" as source
4. Enters workflow settings
5. Adds 5 articles manually:
   - Title: "..." / Prompt: "..."
   - Title: "..." / Prompt: "..."
   - etc.
6. Saves workflow
7. Clicks "Run Workflow"
8. Processes articles one by one with previews
9. User approves each
10. All saved to database

## Benefits

✅ **Reusable**: Save time by reusing workflow configurations
✅ **Batch Processing**: Generate multiple articles at once
✅ **Flexible**: Choose between Google Sheets or manual input
✅ **Control**: Preview and edit before final save
✅ **Trackable**: See progress and history
✅ **No Google Required**: Manual mode works without Google account

## Next Steps

1. Implement the API routes (start with workflows CRUD)
2. Install rich text editor dependencies
3. Build the Workflows list page
4. Build the workflow creator form
5. Implement the runner with preview
6. Test end-to-end

See the inline code comments and type definitions for implementation details!
