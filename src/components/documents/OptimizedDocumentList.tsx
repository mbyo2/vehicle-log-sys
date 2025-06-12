
import React, { memo, useMemo } from 'react';
import { Document } from '@/types/document';
import { useVirtualScrolling, useDebounce } from '@/hooks/usePerformanceOptimization';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { DocumentListItem } from './DocumentListItem';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface OptimizedDocumentListProps {
  documents: Document[];
  onPreview: (document: Document) => void;
  onDownload: (document: Document) => void;
  onDelete: (documentId: string) => void;
  showVerification?: boolean;
}

const ITEM_HEIGHT = 80;
const CONTAINER_HEIGHT = 600;

export const OptimizedDocumentList = memo(function OptimizedDocumentList({
  documents,
  onPreview,
  onDownload,
  onDelete,
  showVerification = false
}: OptimizedDocumentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const filteredDocuments = useMemo(() => {
    if (!debouncedSearchTerm) return documents;
    
    return documents.filter(doc =>
      doc.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [documents, debouncedSearchTerm]);

  const {
    visibleItems,
    handleScroll,
    totalHeight,
    offsetY
  } = useVirtualScrolling(filteredDocuments, ITEM_HEIGHT, CONTAINER_HEIGHT);

  const { ref: loadMoreRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search documents..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div 
        className="relative border rounded-lg"
        style={{ height: CONTAINER_HEIGHT }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0
            }}
          >
            {visibleItems.items.map((document, index) => (
              <DocumentListItem
                key={document.id}
                document={document}
                onPreview={onPreview}
                onDownload={onDownload}
                onDelete={onDelete}
                showVerification={showVerification}
                style={{ height: ITEM_HEIGHT }}
              />
            ))}
          </div>
        </div>
        
        <div ref={loadMoreRef} className="h-4" />
      </div>
    </div>
  );
});
