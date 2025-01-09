import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Folder, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DocumentCategories() {
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories, isLoading } = useQuery({
    queryKey: ["document-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data;
    },
  });

  const createCategory = useMutation({
    mutationFn: async (category: { name: string; description: string }) => {
      const { error } = await supabase
        .from("document_categories")
        .insert([category]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-categories"] });
      setNewCategory({ name: "", description: "" });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategory.mutate(newCategory);
  };

  if (isLoading) {
    return <div>Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Category</CardTitle>
          <CardDescription>Add a new document category</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                placeholder="Category Name"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Textarea
                placeholder="Description"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, description: e.target.value })
                }
              />
            </div>
            <Button type="submit" disabled={createCategory.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Create Category
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories?.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Folder className="w-5 h-5 mr-2" />
                {category.name}
              </CardTitle>
              {category.description && (
                <CardDescription>{category.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" size="sm">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}