'use client';

import { useTasker } from '@/hooks/useTasker';
import Layout from '@/components/Layout';
import TaskForm from '@/components/TaskForm';
import TaskItem from '@/components/TaskItem';

export default function HomePage() {
  const { filteredTasks, isLoading } = useTasker();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Task Form */}
        <div className="mb-8">
          <TaskForm placeholder="What needs to be done? Try @today !high #work ~inbox" />
        </div>

        {/* Task List */}
        <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-base-content mb-2">
                No tasks yet
              </h3>
              <p className="text-base-content/70 mb-6">
                Add your first task using the form above. You can use special syntax like:
              </p>
              <div className="text-sm text-base-content/50 space-y-1">
                <div><code className="bg-base-200 px-2 py-1 rounded">@today</code> for due dates</div>
                <div><code className="bg-base-200 px-2 py-1 rounded">!high</code> for priority</div>
                <div><code className="bg-base-200 px-2 py-1 rounded">#work</code> for tags</div>
                <div><code className="bg-base-200 px-2 py-1 rounded">~inbox</code> for lists</div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-base-300">
              {filteredTasks.map((task) => (
                <div key={task.id} className="group hover:bg-base-50">
                  <TaskItem task={task} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Task Statistics */}
        {filteredTasks.length > 0 && (
          <div className="mt-6 p-4 bg-base-200 rounded-lg">
            <div className="flex items-center justify-between text-sm text-base-content/70">
              <span>
                {filteredTasks.filter(t => !t.completed).length} pending • {' '}
                {filteredTasks.filter(t => t.completed).length} completed
              </span>
              <span>
                {filteredTasks.length} total task{filteredTasks.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}