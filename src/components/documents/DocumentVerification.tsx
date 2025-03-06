
import { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { Document } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DocumentVerificationProps {
  document: Document;
}

export function DocumentVerification({ document }: DocumentVerificationProps) {
  const [status, setStatus] = useState<'verified' | 'rejected'>('verified');
  const [notes, setNotes] = useState('');
  const { verifyDocument } = useDocuments();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyDocument.mutate({
      documentId: document.id,
      status,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium">Document details:</h3>
        <p className="text-sm">Name: {document.name}</p>
        <p className="text-sm">Type: {document.type.replace('_', ' ')}</p>
        {document.expiry_date && (
          <p className="text-sm">Expires: {new Date(document.expiry_date).toLocaleDateString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Verification Status:</h3>
        <RadioGroup defaultValue="verified" value={status} onValueChange={(value) => setStatus(value as 'verified' | 'rejected')}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="verified" id="verified" />
            <Label htmlFor="verified">Verified</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="rejected" id="rejected" />
            <Label htmlFor="rejected">Rejected</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional):</Label>
        <Textarea
          id="notes"
          placeholder="Add any verification notes here..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={verifyDocument.isPending}>
          {verifyDocument.isPending ? 'Submitting...' : 'Submit Verification'}
        </Button>
      </div>
    </form>
  );
}
