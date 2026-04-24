// src/pages/Tasks.tsx
import { useState, useMemo, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ListTodo,
  ArrowRight,
  CircleDashed,
  Filter,
  BookOpen,
  Search,
  X,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_BASE } from "@/lib/config";

interface TaskItem {
  id: string;
  title: string;
  priority: string;
  type: string;
  points: number;
}

interface UserStory {
  id: string;
  title: string;
  description: string;
  totalPoints: number;
  tasks: TaskItem[];
}

const DEFAULT_BACKLOG: UserStory[] = [
  {
    id: "STORY-101",
    title: "AI Analysis in Progress",
    description: "Please wait while the AI pipeline generates your user stories and tasks.",
    totalPoints: 0,
    tasks: []
  }
];

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [backlogStories, setBacklogStories] = useState<UserStory[]>(DEFAULT_BACKLOG);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        let aiStories = [];
        let aiTasks = [];

        if (projectId) {
          const [storiesRes, tasksRes] = await Promise.all([
            fetch(`${BACKEND_BASE}/api/projects/${projectId}/analysis`),
            fetch(`${BACKEND_BASE}/api/projects/${projectId}/tasks`)
          ]);

          if (storiesRes.ok) {
            const analysis = await storiesRes.json();
            aiStories = Array.isArray(analysis.stories) ? analysis.stories : [];
          }

          if (tasksRes.ok) {
            const tasksData = await tasksRes.json();
            aiTasks = Array.isArray(tasksData) ? tasksData : [];
          }
        }

        if (aiStories.length === 0 && aiTasks.length === 0) {
          const rawData = localStorage.getItem("blueprint_project_data");
          if (rawData) {
            const parsed = JSON.parse(rawData);
            aiStories = parsed.stories || [];
            aiTasks = parsed.tasks || [];
          }
        }

        if (aiStories.length > 0 || aiTasks.length > 0) {
          // 1. Group tasks by their parent User Story
          const mappedBacklog = aiStories.map((story: any, index: number) => {
            // Find tasks that belong to this story
            const storyTasks = aiTasks.filter((t: any) => t.storyId === story.id);
            
            // Calculate total points dynamically if the AI didn't provide a total
            const totalPoints = story.totalPoints || storyTasks.reduce((sum: number, t: any) => sum + (t.points || t.storyPoints || 3), 0);

            // Safely parse the description/acceptance criteria
            let parsedDescription = story.description;
            if (!parsedDescription && story.acceptanceCriteria) {
              parsedDescription = Array.isArray(story.acceptanceCriteria) 
                ? story.acceptanceCriteria.join(' • ') 
                : story.acceptanceCriteria;
            }

            return {
              id: story.id || `US-${index + 1}`,
              // THE FIX: Add story.story to the title fallbacks
              title: story.title || story.name || story.story || "Untitled Story",
              // THE FIX: Use parsedDescription
              description: parsedDescription || "No description provided.",
              totalPoints: totalPoints,
              tasks: storyTasks.map((t: any, tIdx: number) => ({
                id: t.id || t.taskId || `TSK-${index}-${tIdx}`,
                // THE FIX: Add t.task to the task fallbacks just in case
                title: t.title || t.name || t.task || "Untitled Task",
                priority: t.priority || "Medium",
                type: t.type || "Backend",
                points: t.points || t.storyPoints || 3
              }))
            };
          });

          // 2. Catch any "Orphaned" tasks that the AI generated without attaching to a specific story
          const orphanedTasks = aiTasks.filter((t: any) => !aiStories.some((s: any) => s.id === t.storyId));
          
          if (orphanedTasks.length > 0) {
            mappedBacklog.push({
              id: "US-GENERAL",
              title: "General Engineering Tasks",
              description: "Architectural and foundational tasks not tied to a specific user story.",
              totalPoints: orphanedTasks.reduce((sum: number, t: any) => sum + (t.points || t.storyPoints || 3), 0),
              tasks: orphanedTasks.map((t: any, tIdx: number) => ({
                id: t.id || t.taskId || `TSK-GEN-${tIdx}`,
                title: t.title || t.name || "Untitled Task",
                priority: t.priority || "Medium",
                type: t.type || "Infrastructure",
                points: t.points || t.storyPoints || 3
              }))
            });
          }

          setBacklogStories(mappedBacklog);
        }
      } catch (e) {
        console.error("Error loading backlog data", e);
      }
    };
    
    fetchTasks();
  }, [projectId]);

  const filteredStories = useMemo(() => {
    if (!searchQuery) return backlogStories;
    const query = searchQuery.toLowerCase();

    return backlogStories.map(story => {
      // Find tasks that match the search query
      const filteredTasks = story.tasks.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.priority.toLowerCase().includes(query) ||
        task.id.toLowerCase().includes(query) ||
        task.type.toLowerCase().includes(query)
      );

      // If story title matches query, include the whole story
      const isStoryMatch = story.title.toLowerCase().includes(query) ||
        story.description.toLowerCase().includes(query);

      if (isStoryMatch) {
        return story;
      }

      if (filteredTasks.length > 0) {
        return {
          ...story,
          tasks: filteredTasks,
        };
      }
      return null;
    }).filter(Boolean) as UserStory[];
  }, [searchQuery, backlogStories]);

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <ListTodo className="w-8 h-8 text-primary" />
            Tasks
          </h1>
          <p className="text-zinc-400 mt-1">Real-time tasks extracted from your PRD analysis.</p>
        </div>
        <div className="flex gap-3">
          {/* FIXED: Filter button now toggles the panel */}
          <Button
            variant="outline"
            className={`gap-2 transition-colors ${isFilterOpen ? 'bg-zinc-800 text-white border-zinc-600' : 'bg-zinc-950 border-zinc-700 text-white hover:bg-zinc-800'}`}
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter className="w-4 h-4" /> {isFilterOpen ? 'Close Filters' : 'Filter'}
          </Button>
          <Button onClick={() => navigate(projectId ? `/dashboard/sprints?projectId=${projectId}` : '/dashboard/sprints')} className="bg-primary hover:brightness-110 text-white gap-2 glow-orange">
            Generate Sprint Plan <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Search & Filter Panel */}
      {isFilterOpen && (
        <Card className="bg-zinc-900 border-zinc-800 mb-8 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
          <CardContent className="p-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search tasks, stories, or priorities..."
                className="pl-10 bg-zinc-950 border-zinc-800 text-white focus:ring-primary h-11"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-zinc-500 hover:text-white"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Priority Recommendations:</span>
              {['Critical', 'High', 'Medium', 'Low'].map((p) => (
                <Button
                  key={p}
                  variant="outline"
                  size="sm"
                  className={`
                    text-xs h-7 px-3 rounded-full border-zinc-800 transition-all
                    ${searchQuery.toLowerCase() === p.toLowerCase()
                      ? 'bg-primary/20 text-primary border-primary/30'
                      : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800'}
                  `}
                  onClick={() => setSearchQuery(p)}
                >
                  {p}
                </Button>
              ))}
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7 px-3 text-zinc-500 hover:text-red-400"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Results
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        {filteredStories.length > 0 ? (
          filteredStories.map((story) => (
            <Card key={story.id} className="bg-zinc-900 border-zinc-800 overflow-hidden shadow-lg border-l-4 border-l-primary/30">
              {/* Story Header */}
              <CardHeader className="border-b border-zinc-800 bg-zinc-950/80 py-4 flex flex-row items-start justify-between gap-4">
                <div className="flex gap-3 items-start">
                  <div className="mt-1 bg-blue-500/10 p-1.5 rounded-md border border-blue-500/20 text-blue-400 shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-white text-base">{story.title}</CardTitle>
                      <span className="text-xs font-mono text-zinc-500">{story.id}</span>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">{story.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 shrink-0">
                  <span className="text-xs text-zinc-400 font-medium">Story Points:</span>
                  <span className="text-sm font-bold text-primary">{story.totalPoints}</span>
                </div>
              </CardHeader>

              {/* Tasks inside the Story */}
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-800/50">
                  {story.tasks && story.tasks.length > 0 ? story.tasks.map((task) => (
                    <div key={task.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors group cursor-pointer pl-4 sm:pl-12">
                      <div className="flex items-start sm:items-center gap-3">
                        <CircleDashed className="w-4 h-4 text-zinc-600 group-hover:text-primary transition-colors shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          <h4 className="text-sm font-medium text-zinc-200">{task.title}</h4>
                          <p className="text-xs text-zinc-500 mt-0.5 font-mono">{task.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 pl-7 sm:pl-0">
                        <Badge variant="outline" className="text-[10px] uppercase bg-zinc-950 border-zinc-700 text-zinc-400 whitespace-nowrap">
                          {task.type}
                        </Badge>
                        <div className="flex items-center gap-2 min-w-[80px]">
                          <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_-1px_rgba(0,0,0,0.3)] ${
                            task.priority?.toLowerCase() === 'high' || task.priority?.toLowerCase() === 'critical' ? 'bg-red-500 shadow-red-500/40' : 
                            task.priority?.toLowerCase() === 'medium' ? 'bg-amber-500 shadow-amber-500/40' : 
                            'bg-green-500 shadow-green-500/40'
                          }`} />
                          <span className="text-xs text-zinc-400 font-medium">{task.priority}</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0" title="Story Points">
                          {task.points}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 text-center text-sm text-zinc-500">
                      No tasks generated for this story.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/50 rounded-xl border-2 border-dashed border-zinc-800">
            <AlertCircle className="w-12 h-12 text-zinc-700 mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No tasks found</h3>
            <p className="text-zinc-500 text-sm">Try adjusting your filters or generating new tasks.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
