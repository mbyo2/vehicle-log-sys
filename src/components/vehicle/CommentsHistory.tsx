import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vehicle } from '@/types/vehicle';
import { format } from 'date-fns';

interface CommentsHistoryProps {
  vehicle: Vehicle;
}

export const CommentsHistory = ({ vehicle }: CommentsHistoryProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vehicle Comments History</CardTitle>
      </CardHeader>
      <CardContent>
        {vehicle.comments && vehicle.comments.length > 0 ? (
          vehicle.comments.map((comment, index) => (
            <div key={comment.id || index} className="border-b py-2 last:border-b-0">
              <p>{comment.text}</p>
              <small className="text-gray-500">
                {format(new Date(comment.timestamp), 'PPpp')}
              </small>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No previous comments</p>
        )}
      </CardContent>
    </Card>
  );
};