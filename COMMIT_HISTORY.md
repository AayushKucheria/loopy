# Loopy v1.1 Commit History

## Recent Commits

### 1. Removed Unnecessary Text from Sidebar (April 15, 2025)
Commit: `5cbcc6cc1bc871c1b535bd1dde15c057a70a09a2`

**Changes:**
- Removed several UI buttons from the sidebar across multiple versions of Loopy (v1, v1.1, and splash)
- Removed links and buttons related to:
  - "save as link"
  - "save as file"/"load from file" (in v1.1)
  - "embed in your website"
  - "make a GIF using LICEcap"
- Simplified the UI by removing unnecessary options while keeping core functionality

### 2. Enhanced postMessage Communication with shareRequested Flag (April 5, 2025)
Commit: `a769db3c7af56eb0c49cbb474c8f037b8158ff43`

**Changes:**
- Added functionality to include the `shareRequested` flag when responding to the parent window
- Modified the postMessage call in Loopy.js to pass along this flag when exporting to CatColab format
- This enhancement improves communication between Loopy and its parent window, allowing for more control over sharing behavior

### 3. Comprehensive Customizations to Loopy (April 2, 2025)
Commit: `c806b23b6fffe634af6bf6bb75b8f0dd23f5c07f`

**Changes:**
- Added extensive functionality to integrate with CatColab format
- Implemented model conversion between Loopy and CatColab formats
- Added major functionality for model import/export:
  - `convertToColabFormat()`: Converts Loopy models to CatColab format with proper UUID generation
  - `loadExternalModel()`: Loads models from external sources
  - `convertToLoopyFormat()`: Converts other formats to Loopy's native format
- Added communication with parent window via postMessage API:
  - Notifies parent when Loopy is ready
  - Responds to requests for model data export

**Specific UI Enhancements:**
- **Sidebar UI Improvements**:
  - Added a toggle button to minimize/maximize the sidebar (`#sidebar_toggle`)
  - Implemented sidebar minimization functionality to maximize workspace
  - Added CSS transitions for smooth sidebar animations
- **Export Modal**:
  - Created a dedicated "Export to CatColab" modal page
  - Added detailed documentation about the export format
  - Included a download button for CatColab export
- **Responsive Design**:
  - Improved handling of canvas width when sidebar is minimized
  - Added proper resizing event handling for UI responsiveness
- **File Import/Export**:
  - Added file system integration for saving/loading models
  - Implemented file export for CatColab format

## Summary

These recent commits significantly enhance Loopy v1.1 with:
1. **Integration Capabilities**: Better communication with parent windows and external systems
2. **Format Conversion**: Support for CatColab format with proper model structure conversion
3. **UI Improvements**: Cleaner interface with collapsible sidebar and better workspace utilization
4. **External Model Support**: Ability to load and save models in various formats
5. **Embedded Usage**: Enhanced capabilities when embedded in other applications