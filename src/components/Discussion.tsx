import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Discussion as DiscussionType, DiscussionFormData, DiscussionProps } from '@/types/discussion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Send, X, User, Clock, Edit, Trash2 } from 'lucide-react';

const Discussion: React.FC<DiscussionProps> = ({ entryId, onClose }) => {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState<DiscussionType[]>([]);
  const [formData, setFormData] = useState<DiscussionFormData>({ content: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadDiscussions();
    // Optionally: set up real-time subscription here
    // ...
    // return () => { unsubscribe };
  }, [entryId]);

  const loadDiscussions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('discussions')
        .select('*')
        .eq('entry_id', entryId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDiscussions(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load discussions.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('discussions')
        .insert([
          {
            entry_id: entryId,
            author_id: user?.uid || user?.id || '',
            author_name: user?.displayName || 'Anonymous',
            content: formData.content.trim(),
          },
        ]);
      if (error) throw error;
      setFormData({ content: '' });
      loadDiscussions();
      toast({ title: 'Success', description: 'Comment added successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add comment. Please try again.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      const { error } = await supabase
        .from('discussions')
        .update({ content: editContent.trim() })
        .eq('id', id)
        .eq('author_id', user?.uid || user?.id || '');
      if (error) throw error;
      setEditingId(null);
      setEditContent('');
      loadDiscussions();
      toast({ title: 'Success', description: 'Comment updated successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update comment. Please try again.', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('discussions')
        .delete()
        .eq('id', id)
        .eq('author_id', user?.uid || user?.id || '');
      if (error) throw error;
      loadDiscussions();
      toast({ title: 'Success', description: 'Comment deleted successfully.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete comment. Please try again.', variant: 'destructive' });
    }
  };

  const startEdit = (discussion: DiscussionType) => {
    setEditingId(discussion.id);
    setEditContent(discussion.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Discussion
            </CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Discussion Form */}
          <form onSubmit={handleSubmit} className="flex-shrink-0">
            <div className="flex gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={formData.content}
                onChange={(e) => setFormData({ content: e.target.value })}
                className="flex-1 min-h-[80px]"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!formData.content.trim() || isSubmitting}
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
          <Separator />
          {/* Discussions List */}
          <div className="flex-1 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading discussions...</p>
              </div>
            ) : discussions.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              discussions.map((discussion) => (
                <div key={discussion.id} className="space-y-2">
                  {editingId === discussion.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(discussion.id)}
                          disabled={!editContent.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{discussion.author_name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {discussion.author_id === (user?.uid || user?.id) ? 'You' : 'Team Member'}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(discussion.created_at)}
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{discussion.content}</p>
                          {discussion.author_id === (user?.uid || user?.id) && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEdit(discussion)}
                                className="h-6 px-2 text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" /> Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(discussion.id)}
                                className="h-6 px-2 text-xs text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Discussion; 