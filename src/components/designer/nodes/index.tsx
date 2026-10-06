import { memo } from 'react';
import { Server, Database, Cloud, User, Cog, HardDrive, Globe, MessageSquare, Shield, Router, Archive, Zap, Network, Box, Container, Cpu } from 'lucide-react';
import { Icon } from '@iconify/react';
import { Handle, Position } from '@xyflow/react';
import { BaseNode, BaseNodeData } from './BaseNode';

interface CustomNodeProps {
  id: string;
  data: BaseNodeData;
  selected?: boolean;
}

// Service Node - Rectangle with server icon
export const ServiceNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Server size={16} />}
    className="bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200"
    shape="rounded"
  />
));
ServiceNode.displayName = 'ServiceNode';

// Database Node - Cylinder shape with database icon
export const DatabaseNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Database size={16} />}
    className="bg-green-50 dark:bg-green-950 border-green-400 dark:border-green-600 text-green-800 dark:text-green-200"
    shape="cylinder"
  />
));
DatabaseNode.displayName = 'DatabaseNode';

// Cloud Node - Stadium shape with cloud icon
export const CloudNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Cloud size={16} />}
    className="bg-purple-50 dark:bg-purple-950 border-purple-400 dark:border-purple-600 text-purple-800 dark:text-purple-200"
    shape="rounded"
  />
));
CloudNode.displayName = 'CloudNode';

// User Node - Circle with user icon
export const UserNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<User size={16} />}
    className="bg-orange-50 dark:bg-orange-950 border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-200"
    shape="circle"
  />
));
UserNode.displayName = 'UserNode';

// Process Node - Diamond shape with cog icon
export const ProcessNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Cog size={16} />}
    className="bg-yellow-50 dark:bg-yellow-950 border-yellow-400 dark:border-yellow-600 text-yellow-800 dark:text-yellow-200"
    shape="diamond"
  />
));
ProcessNode.displayName = 'ProcessNode';

// Server Node - Hexagon shape with server icon
export const ServerNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Server size={16} />}
    className="bg-slate-50 dark:bg-slate-950 border-slate-400 dark:border-slate-600 text-slate-800 dark:text-slate-200"
    shape="hexagon"
  />
));
ServerNode.displayName = 'ServerNode';

// Disk Node - Rectangle with beveled edges (storage)
export const DiskNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<HardDrive size={16} />}
    className="bg-indigo-50 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200"
    shape="rounded"
  />
));
DiskNode.displayName = 'DiskNode';

// Internet Node - Circle with globe icon
export const InternetNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Globe size={16} />}
    className="bg-cyan-50 dark:bg-cyan-950 border-cyan-400 dark:border-cyan-600 text-cyan-800 dark:text-cyan-200"
    shape="circle"
  />
));
InternetNode.displayName = 'InternetNode';

// Queue Node - Stadium shape with message icon (horizontal pill)
export const QueueNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<MessageSquare size={16} />}
    className="bg-pink-50 dark:bg-pink-950 border-pink-400 dark:border-pink-600 text-pink-800 dark:text-pink-200"
    shape="stadium"
  />
));
QueueNode.displayName = 'QueueNode';

// Load Balancer Node - Triangle shape with network icon
export const LoadBalancerNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Network size={16} />}
    className="bg-emerald-50 dark:bg-emerald-950 border-emerald-400 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200"
    shape="triangle"
  />
));
LoadBalancerNode.displayName = 'LoadBalancerNode';

// Firewall Node - Rectangle with shield icon
export const FirewallNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Shield size={16} />}
    className="bg-red-50 dark:bg-red-950 border-red-400 dark:border-red-600 text-red-800 dark:text-red-200"
    shape="rounded"
  />
));
FirewallNode.displayName = 'FirewallNode';

// Gateway Node - Trapezoid shape with router icon
export const GatewayNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Router size={16} />}
    className="bg-violet-50 dark:bg-violet-950 border-violet-400 dark:border-violet-600 text-violet-800 dark:text-violet-200"
    shape="trapezoid"
  />
));
GatewayNode.displayName = 'GatewayNode';

// Storage Node - Rectangle with archive icon
export const StorageNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Archive size={16} />}
    className="bg-amber-50 dark:bg-amber-950 border-amber-400 dark:border-amber-600 text-amber-800 dark:text-amber-200"
    shape="rounded"
  />
));
StorageNode.displayName = 'StorageNode';

// Cache Node - Rectangle with zap icon
export const CacheNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Zap size={16} />}
    className="bg-lime-50 dark:bg-lime-950 border-lime-400 dark:border-lime-600 text-lime-800 dark:text-lime-200"
    shape="rounded"
  />
));
CacheNode.displayName = 'CacheNode';

// Message Queue Node - Rectangle with message icon
export const MessageQueueNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<MessageSquare size={16} />}
    className="bg-rose-50 dark:bg-rose-950 border-rose-400 dark:border-rose-600 text-rose-800 dark:text-rose-200"
    shape="rounded"
  />
));
MessageQueueNode.displayName = 'MessageQueueNode';

// API Node - Rectangle with box icon
export const ApiNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Box size={16} />}
    className="bg-teal-50 dark:bg-teal-950 border-teal-400 dark:border-teal-600 text-teal-800 dark:text-teal-200"
    shape="rounded"
  />
));
ApiNode.displayName = 'ApiNode';

// Microservice Node - Rectangle with container icon
export const MicroserviceNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Container size={16} />}
    className="bg-sky-50 dark:bg-sky-950 border-sky-400 dark:border-sky-600 text-sky-800 dark:text-sky-200"
    shape="rounded"
  />
));
MicroserviceNode.displayName = 'MicroserviceNode';

// Container Node - Rectangle with container icon
export const ContainerNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Container size={16} />}
    className="bg-blue-50 dark:bg-blue-950 border-blue-400 dark:border-blue-600 text-blue-800 dark:text-blue-200"
    shape="rounded"
  />
));
ContainerNode.displayName = 'ContainerNode';

// Lambda Node - Rectangle with CPU icon
export const LambdaNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Cpu size={16} />}
    className="bg-orange-50 dark:bg-orange-950 border-orange-400 dark:border-orange-600 text-orange-800 dark:text-orange-200"
    shape="rounded"
  />
));
LambdaNode.displayName = 'LambdaNode';

// CDN Node - Circle with globe icon
export const CdnNode = memo((props: CustomNodeProps) => (
  <BaseNode
    {...props}
    icon={<Globe size={16} />}
    className="bg-purple-50 dark:bg-purple-950 border-purple-400 dark:border-purple-600 text-purple-800 dark:text-purple-200"
    shape="circle"
  />
));
CdnNode.displayName = 'CdnNode';

// Junction Node - Small circle for connecting multiple edges
export const JunctionNode = memo((props: CustomNodeProps) => (
  <div
    className={`w-4 h-4 rounded-full border-2 bg-background border-primary ${
      props.selected ? 'ring-2 ring-primary ring-offset-2' : ''
    }`}
  >
    <Handle type="target" position={Position.Top} id="T" className="!opacity-0" />
    <Handle type="target" position={Position.Left} id="L" className="!opacity-0" />
    <Handle type="source" position={Position.Bottom} id="B" className="!opacity-0" />
    <Handle type="source" position={Position.Right} id="R" className="!opacity-0" />
  </div>
));
JunctionNode.displayName = 'JunctionNode';

// Group Node - Large rounded rectangle for containing other nodes (subgraph)
export const GroupNode = memo((props: CustomNodeProps) => (
  <div
    className="relative min-w-[200px] min-h-[150px] px-6 py-4 border-4 border-dashed border-gray-400 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-900/50 rounded-xl"
  >
    <div className="flex items-center gap-2 mb-2">
      {props.data.icon ? (
        <Icon icon={props.data.icon} width={20} className="text-gray-600 dark:text-gray-400" />
      ) : (
        <Box size={20} className="text-gray-600 dark:text-gray-400" />
      )}
      <span className="text-lg font-semibold text-gray-700 dark:text-gray-300">{props.data.label}</span>
    </div>
  </div>
));
GroupNode.displayName = 'GroupNode';

// eslint-disable-next-line react-refresh/only-export-components -- this map of components is consumed directly by ReactFlow's `nodeTypes` prop
export const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  cloud: CloudNode,
  user: UserNode,
  process: ProcessNode,
  server: ServerNode,
  disk: DiskNode,
  internet: InternetNode,
  queue: QueueNode,
  loadbalancer: LoadBalancerNode,
  firewall: FirewallNode,
  gateway: GatewayNode,
  storage: StorageNode,
  cache: CacheNode,
  messagequeue: MessageQueueNode,
  api: ApiNode,
  microservice: MicroserviceNode,
  container: ContainerNode,
  lambda: LambdaNode,
  cdn: CdnNode,
  group: GroupNode,
  junction: JunctionNode,
};
