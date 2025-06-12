
import React, { memo } from 'react';
import { Document } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { MoreVertical, Eye, Download, Trash, FilePenLine } from 'lucide-react';

interface DocumentListItemProps {
  document: Document;
  onPreview: (document: Document) => void;
  onDownload: (document: Document) => void;
  onDelete: (documentId: string) => void;
  showVerification?: boolean;
  style?: React.CSSProperties;
}

export const DocumentListItem = memo(function DocumentListItem({
  document,
  onPreview,
  onDownload,
  onDelete,
  showVerification = false,
  style
}: DocumentListItemProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="outline" className="bg-green-50 text-green-600">Verified</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-600">Rejected</Badge>;
      default:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600">Pending</Badge>;
    }
  };

  const isExpired = (date?: string) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  const isExpiringSoon = (date?: string) => {
    if (!date) return false;
    const expiryDate = new Date(date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  };

  return (
    <div 
      className="flex items-center justify-between p-4 border-b hover:bg-accent/50 transition-colors"
      style={style}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h4 className="font-medium truncate">{document.name}</h4>
            <p className="text-sm text-muted-foreground">
              {document.type.replace('_', ' ')} • {format(new Date(document.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {getStatusBadge(document.verification_status)}
            
            {document.expiry_date && (
              <Badge
                variant={isExpired(document.expiry_date) ? 'destructive' : 
                        isExpiringSoon(document.expiry_date) ? 'secondary' : 'outline'}
              >
                {isExpired(document.expiry_date) ? 'Expired' : 
                 isExpiringSoon(document.expiry_date) ? 'Expiring Soon' : 'Valid'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onPreview(document)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDownload(document)}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </DropdownMenuItem>
          {showVerification && document.verification_status === 'pending' && (
            <DropdownMenuItem>
              <FilePenLine className="mr-2 h-4 w-4" />
              Verify
            </DropdownMenuItem>
          )}
          <DropdownMenuItem 
            onClick={() => onDelete(document.id)}
            className="text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
});
