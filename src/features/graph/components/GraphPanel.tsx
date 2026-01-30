/** Graph panel - using React Flow */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Eye, EyeOff, ExternalLink, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVaultStore } from '@/stores/vaultStore';
import { useTabStore } from '@/stores/tabStore';
import { useSettingsStore } from '@/stores';
import { useTranslation } from '@/i18n';
import { buildGraphData } from '../utils';
import { getBidirectionalLinks, type BidirectionalLinkGroup } from '@/services/linkService';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { GraphNode as GraphNodeData, GraphEdge as GraphEdgeData } from '../types';

// Custom node component
interface CustomNodeProps {
  data: {
    label: string;
    linkCount: number;
    isOrphan: boolean;
    isCurrent: boolean;
    hasBacklinks: boolean;
    icon?: string;
    iconType?: 'lucide' | 'emoji';
  };
  selected?: boolean;
}

function CustomNode({ data, selected }: CustomNodeProps) {
  const { label, linkCount, isOrphan, isCurrent, hasBacklinks } = data;

  // Determine node color based on type
  const getNodeStyle = () => {
    if (isCurrent) {
      return 'bg-pink-500 border-pink-600 text-white shadow-pink-500/30';
    }
    if (hasBacklinks && !isOrphan) {
      return 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/30';
    }
    if (isOrphan) {
      return 'bg-gray-400 border-gray-500 text-white shadow-gray-400/30';
    }
    return 'bg-indigo-500 border-indigo-600 text-white shadow-indigo-500/30';
  };

  // Calculate node size based on link count
  const size = Math.max(40, Math.min(80, 40 + linkCount * 5));

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center border-2 transition-all cursor-pointer',
        'hover:scale-110 hover:shadow-lg',
        selected && 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110',
        getNodeStyle()
      )}
      style={{
        width: size,
        height: size,
        boxShadow: selected ? '0 0 20px currentColor' : '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      {/* React Flow Handles for edge connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="bg-transparent! border-0! w-full! h-full! top-0! left-0! transform-none! rounded-full!"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="bg-transparent! border-0! w-full! h-full! top-0! left-0! transform-none! rounded-full!"
      />
      <span className="text-xs font-medium truncate px-1 max-w-full text-center leading-tight">
        {label.length > 8 ? label.slice(0, 8) + '...' : label}
      </span>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

interface GraphPanelProps {
  vaultPath: string;
  currentPageId?: string;
}

export function GraphPanel({ vaultPath, currentPageId }: GraphPanelProps) {
  const { t } = useTranslation();
  const isMountedRef = useRef(true);

  const pages = useVaultStore(state => state.pages);
  const openTab = useTabStore(state => state.openTab);
  const theme = useSettingsStore(state => state.appearance.theme);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [showOrphans, setShowOrphans] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null);
  const [nodeBacklinks, setNodeBacklinks] = useState<BidirectionalLinkGroup[]>([]);
  const [nodesWithBacklinks, setNodesWithBacklinks] = useState<Set<string>>(new Set());

  // Determine if dark theme
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Original graph data reference (for node details and relayout)
  const graphDataRef = useRef<{ nodes: GraphNodeData[]; links: GraphEdgeData[] }>({ nodes: [], links: [] });

  // Force-directed layout algorithm
  const calculateLayout = useCallback((graphNodes: GraphNodeData[], graphEdges: GraphEdgeData[]) => {
    const nodeCount = graphNodes.length;
    if (nodeCount === 0) return { nodes: [], edges: [] };

    // Use circular layout as initial positions
    const radius = Math.max(200, nodeCount * 30);
    const centerX = 400;
    const centerY = 300;

    // Create node position mapping
    const positions: Record<string, { x: number; y: number }> = {};
    graphNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodeCount;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // Simple force-directed iteration (optimize layout)
    const iterations = 50;
    const repulsion = 5000;
    const attraction = 0.01;
    const maxForce = 100; // Limit max force

    for (let i = 0; i < iterations; i++) {
      const forces: Record<string, { x: number; y: number }> = {};
      graphNodes.forEach(node => {
        forces[node.id] = { x: 0, y: 0 };
      });

      // Repulsion (between nodes)
      for (let j = 0; j < graphNodes.length; j++) {
        for (let k = j + 1; k < graphNodes.length; k++) {
          const nodeA = graphNodes[j];
          const nodeB = graphNodes[k];
          const dx = positions[nodeB.id].x - positions[nodeA.id].x;
          const dy = positions[nodeB.id].y - positions[nodeA.id].y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.max(10, Math.sqrt(distSq)); // Minimum distance is 10
          const force = Math.min(maxForce, repulsion / distSq);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (Number.isFinite(fx) && Number.isFinite(fy)) {
            forces[nodeA.id].x -= fx;
            forces[nodeA.id].y -= fy;
            forces[nodeB.id].x += fx;
            forces[nodeB.id].y += fy;
          }
        }
      }

      // Attraction (edge-connected nodes)
      graphEdges.forEach(edge => {
        const sourcePos = positions[edge.source];
        const targetPos = positions[edge.target];
        if (sourcePos && targetPos) {
          const dx = targetPos.x - sourcePos.x;
          const dy = targetPos.y - sourcePos.y;
          const fx = dx * attraction;
          const fy = dy * attraction;

          if (Number.isFinite(fx) && Number.isFinite(fy)) {
            forces[edge.source].x += fx;
            forces[edge.source].y += fy;
            forces[edge.target].x -= fx;
            forces[edge.target].y -= fy;
          }
        }
      });

      // Apply forces
      graphNodes.forEach(node => {
        const fx = forces[node.id].x * 0.1;
        const fy = forces[node.id].y * 0.1;
        if (Number.isFinite(fx) && Number.isFinite(fy)) {
          positions[node.id].x += fx;
          positions[node.id].y += fy;
        }
      });
    }

    // Convert to React Flow format, ensure valid positions
    const flowNodes: Node[] = graphNodes.map(node => {
      const pos = positions[node.id];
      return {
        id: node.id,
        type: 'custom',
        position: {
          x: Number.isFinite(pos.x) ? pos.x : centerX,
          y: Number.isFinite(pos.y) ? pos.y : centerY,
        },
        data: {
          label: node.label,
          linkCount: node.linkCount,
          isOrphan: node.isOrphan,
          isCurrent: node.isCurrent || false,
          hasBacklinks: nodesWithBacklinks.has(node.id),
          icon: node.icon,
          iconType: node.iconType,
        },
      };
    });

    const flowEdges: Edge[] = graphEdges.map((edge, index) => {
      // Set different colors based on edge type: link = blue solid, text = gray dashed
      const isLink = edge.type === 'link';
      const strokeColor = isLink
        ? (isDark ? 'rgba(99, 102, 241, 0.5)' : 'rgba(79, 70, 229, 0.4)')
        : (isDark ? 'rgba(156, 163, 175, 0.4)' : 'rgba(107, 114, 128, 0.3)');
      const markerColor = isLink
        ? (isDark ? 'rgba(99, 102, 241, 0.7)' : 'rgba(79, 70, 229, 0.6)')
        : (isDark ? 'rgba(156, 163, 175, 0.6)' : 'rgba(107, 114, 128, 0.5)');

      return {
        id: `e-${edge.source}-${edge.target}-${index}`,
        source: edge.source,
        target: edge.target,
        type: 'default',
        animated: false,
        style: {
          stroke: strokeColor,
          strokeWidth: isLink ? 2 : 1.5,
          strokeDasharray: isLink ? undefined : '5,5',
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: markerColor,
          width: 15,
          height: 15,
        },
      };
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [isDark, nodesWithBacklinks]);

  // Load graph data
  useEffect(() => {
    if (!vaultPath || pages.length === 0) return;

    const loadData = async () => {
      try {
        const data = await buildGraphData(pages, vaultPath, currentPageId);

        if (!isMountedRef.current) return;

        // Calculate nodes with backlinks
        const backlinksSet = new Set<string>();
        data.links.forEach(link => {
          backlinksSet.add(link.target);
        });
        setNodesWithBacklinks(backlinksSet);

        // Filter orphan nodes
        let filteredNodes = data.nodes;
        let filteredLinks = data.links;
        if (!showOrphans) {
          filteredNodes = data.nodes.filter(n => !n.isOrphan);
          const nodeIds = new Set(filteredNodes.map(n => n.id));
          filteredLinks = data.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));
        }

        // Save original data
        graphDataRef.current = { nodes: filteredNodes, links: filteredLinks };

        // Calculate layout
        const { nodes: flowNodes, edges: flowEdges } = calculateLayout(filteredNodes, filteredLinks);
        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (error) {
        console.error('[GraphPanel] Failed to load graph data:', error);
      }
    };

    loadData();
  }, [vaultPath, pages, currentPageId, showOrphans, calculateLayout, setNodes, setEdges]);

  // Load bidirectional links for selected node
  useEffect(() => {
    if (!selectedNode || !vaultPath) {
      setNodeBacklinks([]);
      return;
    }

    getBidirectionalLinks(vaultPath, selectedNode.id, selectedNode.label, pages)
      .then(groups => {
        if (isMountedRef.current) {
          setNodeBacklinks(groups);
        }
      })
      .catch(error => {
        console.error('[GraphPanel] Failed to load backlinks:', error);
      });
  }, [selectedNode, vaultPath, pages]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Node click handler
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const graphNode = graphDataRef.current.nodes.find(n => n.id === node.id);
    if (graphNode) {
      setSelectedNode(graphNode);
    }
  }, []);

  // Navigate to page
  const navigateToPage = useCallback((pageId: string) => {
    if (!isMountedRef.current || !pages || pages.length === 0) {
      return;
    }

    const page = pages.find(p => p.id === pageId);
    if (page) {
      try {
        openTab(page.id, page.title, page.icon, page.iconType);
      } catch (error) {
        console.error('[GraphPanel] Failed to open tab:', error);
      }
    }
  }, [pages, openTab]);

  // Relayout
  const handleRelayout = useCallback(() => {
    const { nodes: graphNodes, links: graphEdges } = graphDataRef.current;
    if (graphNodes.length === 0) return;

    const { nodes: flowNodes, edges: flowEdges } = calculateLayout(graphNodes, graphEdges);
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [calculateLayout, setNodes, setEdges]);

  // Background color
  const bgColor = isDark ? '#0f172a' : '#f8fafc';

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border shrink-0">
        {/* Orphan nodes toggle */}
        <button
          type="button"
          className={cn(
            'p-1.5 rounded text-xs transition-colors',
            showOrphans ? 'text-foreground hover:bg-muted' : 'text-muted-foreground hover:bg-muted'
          )}
          onClick={() => setShowOrphans(!showOrphans)}
          title={showOrphans ? (t.graph?.hideOrphans || '隐藏孤立节点') : (t.graph?.showOrphans || '显示孤立节点')}
        >
          {showOrphans ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Relayout */}
        <button
          type="button"
          className="p-1.5 rounded hover:bg-muted text-muted-foreground"
          onClick={handleRelayout}
          title="Relayout"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {/* Statistics */}
        <div className="text-xs text-muted-foreground px-2">
          {nodes.length} 节点 · {edges.length} 链接
        </div>
      </div>

      {/* Graph canvas */}
      <div className="flex-1 min-h-0 relative">
        <ErrorBoundary
          fallback={
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              图谱加载失败，请刷新重试
            </div>
          }
        >
          {nodes.length > 0 ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{ padding: 0.2 }}
              minZoom={0.1}
              maxZoom={4}
              style={{ background: bgColor }}
              proOptions={{ hideAttribution: true }}
            >
              <Background color={isDark ? '#334155' : '#cbd5e1'} gap={20} />
              <Controls
                showInteractive={false}
                className="bg-card! border-border! shadow-lg!"
              />
              <MiniMap
                nodeColor={(node) => {
                  const data = node.data as CustomNodeProps['data'];
                  if (data.isCurrent) return '#ec4899';
                  if (data.hasBacklinks && !data.isOrphan) return '#10b981';
                  if (data.isOrphan) return '#9ca3af';
                  return '#6366f1';
                }}
                maskColor={isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.8)'}
                className="bg-card! border-border!"
              />
            </ReactFlow>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              {t.graph?.noData || '暂无数据'}
            </div>
          )}
        </ErrorBoundary>

        {/* Node detail panel */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 right-4 max-w-sm bg-card/95 border border-border rounded-lg shadow-lg overflow-hidden backdrop-blur-sm z-10">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="font-medium text-sm truncate flex-1">{selectedNode.label}</div>
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => navigateToPage(selectedNode.id)}
                  title={t.common?.open || '打开'}
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto">
              <div className="text-xs text-muted-foreground mb-2">
                {selectedNode.linkCount} 个链接
                {selectedNode.isOrphan && ' · 孤立节点'}
                {selectedNode.isCurrent && ' · 当前页面'}
                {nodesWithBacklinks.has(selectedNode.id) && ' · 有反向链接'}
              </div>
              {nodeBacklinks.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    {t.editor?.bidirectionalLinks || '双向链接'} ({nodeBacklinks.reduce((sum, g) => sum + g.mentions.length, 0)})
                  </div>
                  <div className="space-y-1">
                    {nodeBacklinks.slice(0, 5).map((group) => (
                      <div
                        key={group.sourcePageId}
                        className="text-xs text-primary cursor-pointer hover:text-primary/80 hover:underline truncate transition-colors"
                        onClick={() => navigateToPage(group.sourcePageId)}
                      >
                        {group.sourcePageTitle}
                        <span className="text-muted-foreground ml-1">({group.mentions.length})</span>
                      </div>
                    ))}
                    {nodeBacklinks.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        +{nodeBacklinks.length - 5} {t.topbar?.more || '更多'}...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-card/90 border border-border rounded-lg px-3 py-2 backdrop-blur-sm text-xs space-y-1 z-10">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
            <span className="text-muted-foreground">{t.graph?.currentPage || '当前页面'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">{t.graph?.hasBacklinks || '有反向链接'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <span className="text-muted-foreground">{t.graph?.normalNode || '普通节点'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">{t.graph?.orphanNode || '孤立节点'}</span>
          </div>
          <div className="border-t border-border my-1 pt-1">
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-indigo-500" />
              <span className="text-muted-foreground">{t.graph?.linkEdge || '双链'}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-4 h-0.5 bg-gray-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0, currentColor 2px, transparent 2px, transparent 4px)' }} />
              <span className="text-muted-foreground">{t.graph?.textEdge || '文本提及'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
