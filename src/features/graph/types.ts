/** Graph type definitions */

export interface GraphNode {
  id: string;
  label: string;
  icon?: string;
  iconType?: 'lucide' | 'emoji';
  linkCount: number;
  isOrphan: boolean;
  isCurrent?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  /** Link type: link = [[]] bidirectional link, text = plain text mention */
  type?: 'link' | 'text';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}
