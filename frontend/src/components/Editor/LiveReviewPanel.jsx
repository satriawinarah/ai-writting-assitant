/**
 * LiveReviewPanel - AI-powered live text review panel component.
 *
 * Provides real-time text analysis to identify areas that need improvement.
 * Issues are highlighted directly in the editor.
 */

export default function LiveReviewPanel({
  enabled,
  loading,
  issues,
  stale,
  error,
  onToggle,
  onRunReview,
  onClearReview,
}) {
  return (
    <div className="live-review-panel">
      <div className="live-review-header">
        <h4>Live Review</h4>
        <button
          className={`live-review-toggle ${enabled ? 'active' : ''}`}
          onClick={onToggle}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {enabled && (
        <div className="live-review-content">
          <p className="live-review-description">
            Analisis teks untuk menemukan area yang perlu diperbaiki.
            Masalah akan di-highlight langsung di editor.
          </p>

          <button
            className="review-btn"
            onClick={onRunReview}
            disabled={loading}
          >
            {loading ? 'Menganalisis...' : 'Jalankan Review'}
          </button>

          {issues.length > 0 && (
            <div className="review-status">
              <span className="issue-count">
                {issues.length} masalah ditemukan
              </span>
              {stale && (
                <span className="stale-warning">
                  (hasil sudah tidak valid, jalankan ulang review)
                </span>
              )}
              <button className="clear-review-btn" onClick={onClearReview}>
                Hapus
              </button>
            </div>
          )}

          {error && (
            <div className={issues.length === 0 && !error.includes('Gagal') ? 'success' : 'error'}>
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
