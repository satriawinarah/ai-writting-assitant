import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const liveReviewPluginKey = new PluginKey('liveReview');

/**
 * Convert a plain text offset to a ProseMirror position.
 * ProseMirror positions account for node boundaries, so we need to traverse
 * the document to find the correct position.
 */
function textOffsetToPos(doc, offset) {
  let currentOffset = 0;
  let result = null;

  doc.descendants((node, pos) => {
    if (result !== null) return false;

    if (node.isText) {
      const textLength = node.text.length;
      if (currentOffset + textLength >= offset) {
        result = pos + (offset - currentOffset);
        return false;
      }
      currentOffset += textLength;
    } else if (node.isBlock && currentOffset > 0) {
      // Account for block boundaries (like paragraph breaks) as newlines
      currentOffset += 1;
      if (currentOffset > offset) {
        result = pos;
        return false;
      }
    }
    return true;
  });

  // If we couldn't find the position, return the end of the document
  if (result === null) {
    result = doc.content.size;
  }

  return result;
}

/**
 * Build decorations from the issues array.
 */
function buildDecorations(doc, issues) {
  if (!issues || issues.length === 0) {
    return DecorationSet.empty;
  }

  const decorations = [];

  issues.forEach((issue, index) => {
    const from = textOffsetToPos(doc, issue.start_offset);
    const to = textOffsetToPos(doc, issue.end_offset);

    if (from !== null && to !== null && from < to && from >= 0 && to <= doc.content.size) {
      const className = issue.severity === 'critical'
        ? 'live-review-critical'
        : 'live-review-warning';

      decorations.push(
        Decoration.inline(from, to, {
          class: className,
          'data-issue-index': index.toString(),
        })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const LiveReviewExtension = Extension.create({
  name: 'liveReview',

  addOptions() {
    return {
      issues: [],
      onIssueClick: null,
    };
  },

  addStorage() {
    return {
      issues: [],
      decorations: DecorationSet.empty,
    };
  },

  addProseMirrorPlugins() {
    const extension = this;

    return [
      new Plugin({
        key: liveReviewPluginKey,

        state: {
          init(_, state) {
            const issues = extension.options.issues || [];
            extension.storage.issues = issues;
            extension.storage.decorations = buildDecorations(state.doc, issues);
            return extension.storage.decorations;
          },

          apply(tr, oldDecorations, oldState, newState) {
            // Check if issues were updated via transaction meta
            const newIssues = tr.getMeta(liveReviewPluginKey);

            if (newIssues !== undefined) {
              // Issues were explicitly updated
              extension.storage.issues = newIssues;
              extension.storage.decorations = buildDecorations(newState.doc, newIssues);
              return extension.storage.decorations;
            }

            // If document changed, we need to invalidate decorations
            if (tr.docChanged) {
              // Clear decorations when document changes
              // User will need to re-run review
              extension.storage.decorations = DecorationSet.empty;
              return DecorationSet.empty;
            }

            // No changes, keep existing decorations
            return oldDecorations;
          },
        },

        props: {
          decorations(state) {
            return this.getState(state);
          },

          handleClick(view, pos, event) {
            // Check if we clicked on a decoration
            const target = event.target;
            if (!target) return false;

            // Check if clicked element has our decoration class
            const isReviewHighlight =
              target.classList?.contains('live-review-critical') ||
              target.classList?.contains('live-review-warning');

            if (!isReviewHighlight) return false;

            // Get the issue index from the data attribute
            const issueIndex = target.getAttribute('data-issue-index');
            if (issueIndex === null) return false;

            const issues = extension.storage.issues;
            const issue = issues[parseInt(issueIndex, 10)];

            if (issue && extension.options.onIssueClick) {
              extension.options.onIssueClick(issue, event, parseInt(issueIndex, 10));
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

/**
 * Helper function to update issues in the editor.
 * Call this with the editor instance and new issues array.
 */
export function setLiveReviewIssues(editor, issues) {
  if (!editor) return;

  const tr = editor.state.tr;
  tr.setMeta(liveReviewPluginKey, issues);
  editor.view.dispatch(tr);
}

/**
 * Helper function to clear all live review decorations.
 */
export function clearLiveReviewIssues(editor) {
  setLiveReviewIssues(editor, []);
}

export default LiveReviewExtension;
