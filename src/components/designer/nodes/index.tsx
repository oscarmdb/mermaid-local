import { memo } from 'react';
import { Server, Database, Cloud, User, Cog } from 'lucide-react';
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

// Cloud Node - Rounded with cloud icon
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

export const nodeTypes = {
  service: ServiceNode,
  database: DatabaseNode,
  cloud: CloudNode,
  user: UserNode,
  process: ProcessNode,
};
