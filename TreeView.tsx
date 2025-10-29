import React, { useState } from 'react';
import type { Question } from './types';

interface TreeNode {
  question: Question;
  children: TreeNode[];
}

interface TreeItemProps {
  node: TreeNode;
  selectedQuestionId: number | null;
  onSelectQuestion: (id: number) => void;
  draggingId: number | null;
  onSetDraggingId: (id: number | null) => void;
  onReorder: (draggedId: number, targetId: number) => void;
}

const TreeItem: React.FC<TreeItemProps> = ({ node, selectedQuestionId, onSelectQuestion, draggingId, onSetDraggingId, onReorder }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const isSelected = node.question.id === selectedQuestionId;
  const isDragging = node.question.id === draggingId;
  const hasChildren = node.children.length > 0;
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('questionId', node.question.id.toString());
    e.dataTransfer.effectAllowed = 'move';
    onSetDraggingId(node.question.id);
  };

  const handleDragEnd = () => {
    onSetDraggingId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedIdStr = e.dataTransfer.getData('questionId');
    if (draggedIdStr) {
      const draggedId = parseInt(draggedIdStr, 10);
      const targetId = node.question.id;
      if (draggedId !== targetId) {
        onReorder(draggedId, targetId);
      }
    }
  };


  return (
    <li 
      className="my-1 relative"
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragOver && <div className="absolute -top-0.5 left-0 w-full h-1 bg-indigo-400 rounded-full z-10" />}
      <div
        onClick={() => onSelectQuestion(node.question.id)}
        className={`px-2 py-1.5 rounded cursor-pointer transition-all flex items-center justify-between ${
          isSelected ? 'bg-indigo-100 text-indigo-800 font-semibold' : 'hover:bg-slate-100 text-slate-700'
        } ${isDragging ? 'opacity-40' : 'opacity-100'}`}
      >
        <span className="truncate">Q{node.question.number}: {node.question.text}</span>
      </div>
      {hasChildren && (
        <ul className="pl-4 border-l-2 border-slate-200 ml-2">
          {node.children.map(childNode => (
            <TreeItem
              key={childNode.question.id}
              node={childNode}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestion={onSelectQuestion}
              draggingId={draggingId}
              onSetDraggingId={onSetDraggingId}
              onReorder={onReorder}
            />
          ))}
        </ul>
      )}
    </li>
  );
};


interface TreeViewProps {
  questions: Question[];
  selectedQuestionId: number | null;
  onSelectQuestion: (id: number) => void;
  draggingId: number | null;
  onSetDraggingId: (id: number | null) => void;
  onReorder: (draggedId: number, targetId: number) => void;
}

const TreeView: React.FC<TreeViewProps> = ({ questions, selectedQuestionId, onSelectQuestion, draggingId, onSetDraggingId, onReorder }) => {
  const tree = React.useMemo(() => {
    if (!questions || questions.length === 0) return [];
    
    const nodes = new Map<number, TreeNode>();
    questions.forEach(q => {
      nodes.set(q.id, { question: q, children: [] });
    });

    const childIds = new Set<number>();
    questions.forEach(q => {
      if (q.followUp) {
        Object.values(q.followUp).forEach(id => {
          if (typeof id === 'number') {
            const parentNode = nodes.get(q.id);
            const childNode = nodes.get(id);
            if (parentNode && childNode) {
              if (!parentNode.children.some(child => child.question.id === childNode.question.id)) {
                 parentNode.children.push(childNode);
              }
              childIds.add(id);
            }
          }
        });
      }
    });
    
    const rootNodes: TreeNode[] = [];
    questions.forEach(q => {
      if (!childIds.has(q.id)) {
        const node = nodes.get(q.id);
        if (node) rootNodes.push(node);
      }
    });
    
    return rootNodes;
  }, [questions]);

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-lg h-[60vh] overflow-y-auto shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-2 px-2">Questions</h3>
      <ul className="text-sm">
        {tree.map(node => (
          <TreeItem
            key={node.question.id}
            node={node}
            selectedQuestionId={selectedQuestionId}
            onSelectQuestion={onSelectQuestion}
            draggingId={draggingId}
            onSetDraggingId={onSetDraggingId}
            onReorder={onReorder}
          />
        ))}
      </ul>
    </div>
  );
};

export default TreeView;