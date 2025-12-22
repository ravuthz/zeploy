import {
	ArrowLeft,
	CheckCircle,
	Clock,
	Code,
	Edit2,
	Eye,
	Loader,
	Play,
	Plus,
	Tag,
	Trash2,
	XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";

import { useSocket } from "./hooks/socket";
import type { Execution, Script, Stats } from "./types";
import ScriptModal from "./components/ScriptModal";
import DetailModal from "./components/DetailModal";
import { apiStats, apiScript, apiExecution, wsExecute, } from "./api";

// StatCard Component
const StatCard = ({
	title,
	value,
	icon,
	color,
}: {
	title: string;
	value: number;
	icon: React.ReactNode;
	color: string;
}) => {
	const colorClasses: Record<string, string> = {
		blue: "bg-blue-50 text-blue-600 border-blue-200",
		gray: "bg-gray-50 text-gray-600 border-gray-200",
		green: "bg-green-50 text-green-600 border-green-200",
		red: "bg-red-50 text-red-600 border-red-200",
		yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
	};

	return (
		<div className={`rounded-sm border p-4 ${colorClasses[color]}`}>
			<div className="flex items-center justify-between">
				<div>
					<p className="text-sm font-medium opacity-70">{title}</p>
					<p className="text-2xl font-bold mt-1">{value}</p>
				</div>
				<div className="opacity-70">{icon}</div>
			</div>
		</div>
	);
};

// ScriptCard Component
const ScriptCard = ({
	script,
	onEdit,
	onDelete,
	onExecute,
}: {
	script: Script;
	onEdit: (script: Script) => void;
	onDelete: (id: string) => void;
	onExecute: (script: Script) => void;
}) => {
	return (
		<div className="border rounded-sm p-4 hover:shadow-md transition-shadow">
			<div className="flex items-start justify-between">
				<div className="flex-1">
					<h3 className="text-sm font-semibold text-gray-900">{script.name}</h3>
					{/* <p className="text-sm text-gray-600 mt-1">{script.description}</p> */}
					<div className="flex items-center gap-2 mt-3">
						{script.tags.map((tag) => (
							<span
								key={tag}
								className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
							>
								<Tag className="w-3 h-3" />
								{tag}
							</span>
						))}
					</div>
				</div>
				<div className="flex items-center gap-2 ml-4">
					<button
						type="button"
						onClick={() => onExecute(script)}
						className="p-2 bg-green-100 text-green-700 rounded-sm hover:bg-green-200 transition-colors"
						title="Execute Script"
					>
						<Play className="w-5 h-5" />
					</button>
					<button
						type="button"
						onClick={() => onEdit(script)}
						className="p-2 bg-blue-100 text-blue-700 rounded-sm hover:bg-blue-200 transition-colors"
						title="Edit Script"
					>
						<Edit2 className="w-5 h-5" />
					</button>
					<button
						type="button"
						onClick={() => onDelete(script.id)}
						className="p-2 bg-red-100 text-red-700 rounded-sm hover:bg-red-200 transition-colors"
						title="Delete Script"
					>
						<Trash2 className="w-5 h-5" />
					</button>
				</div>
			</div>
		</div>
	);
};

// ExecutionRow Component
const ExecutionRow = ({
	execution,
	onView,
}: {
	execution: Execution;
	onView: (execution: Execution) => void;
}) => {
	const getStatusBadge = (status: string) => {
		const classes = {
			failed: "bg-red-100 text-red-800",
			running: "bg-yellow-100 text-yellow-800",
			completed: "bg-green-100 text-green-800",
		};

		const icons = {
			failed: <XCircle className="w-4 h-4" />,
			running: <Loader className="w-4 h-4 animate-spin" />,
			completed: <CheckCircle className="w-4 h-4" />,
		};

		return (
			<span
				className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${classes[status as keyof typeof classes]}`}
			>
				{icons[status as keyof typeof icons]}
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</span>
		);
	};

	const getDuration = () => {
		if (!execution.completed_at) return "-";
		const start = new Date(execution.started_at).getTime();
		const end = new Date(execution.completed_at).getTime();
		const duration = (end - start) / 1000;
		return `${duration.toFixed(2)}s`;
	};

	return (
		<tr className="hover:bg-gray-50">
			<td className="px-6 py-4 whitespace-nowrap">
				<div className="text-sm font-medium text-gray-900">
					{execution.script_name}
				</div>
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				{getStatusBadge(execution.status)}
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				<div className="text-sm text-gray-500">
					{new Date(execution.started_at).toLocaleString()}
				</div>
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				<div className="text-sm text-gray-500">{getDuration()}</div>
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				<button
					type="button"
					onClick={() => onView(execution)}
					className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-sm hover:bg-blue-200 transition-colors text-sm"
				>
					<Eye className="w-4 h-4" />
					View
				</button>
			</td>
		</tr>
	);
};

// LiveExecution Component
const LiveExecution = ({
	script,
	onBack,
}: {
	script: Script | null;
	onBack: () => void;
}) => {
	// const logContainerRef = useRef<HTMLPreElement>(null);

	const { connected, status, message, output } = useSocket({
		url: `${wsExecute}/${script?.id}`,
	});

	useEffect(() => {
		if (connected && message) {
			console.log({
				connected,
				message,
			});
		}
	}, [connected, message]);

	// useEffect(() => {
	// 	if (logContainerRef.current) {
	// 		logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
	// 	}
	// }, [log]);

	return (
		<div className="bg-white rounded-sm shadow-sm border h-full">
			<div className="p-6 border-b flex items-center justify-between">
				<div className="flex items-center gap-4">
					<button
						type="button"
						onClick={onBack}
						className="flex items-center gap-2 px-4 py-2 border rounded-sm hover:bg-gray-100 transition-colors"
					>
						<ArrowLeft className="w-5 h-5" />
						Back
					</button>
					<h2 className="text-xl font-semibold text-gray-900">
						Executing: {script?.name}
					</h2>
				</div>
				<div>
					{status === "running" && (
						<span className="text-yellow-600 font-semibold">Running...</span>
					)}
					{status === "completed" && (
						<span className="text-green-600 font-semibold">Completed</span>
					)}
					{status === "failed" && (
						<span className="text-red-600 font-semibold">Failed</span>
					)}
				</div>
			</div>

			<div className="max-h-[450px] overflow-y-auto">
				<SyntaxHighlighter language="bash" style={atomDark} className="min-h-[450px]">
					{output.join("")}
				</SyntaxHighlighter>
			</div>
		</div>
	);
};

// Main App Component
function App() {
	const [stats, setStats] = useState<Stats | null>(null);
	const [scripts, setScripts] = useState<Script[]>([]);
	const [executions, setExecutions] = useState<Execution[]>([]);
	const [selectedScript, setSelectedScript] = useState<Script | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
	const [selectedExecution, setSelectedExecution] = useState<Execution | null>(
		null,
	);
	const [isExecuting, setIsExecuting] = useState(false);

	const loadData = async () => {
		try {
			const [statsRes, scriptsRes, executionsRes] = await Promise.all([
				apiStats.list(),
				apiScript.list(),
				apiExecution.list(),
			]);
			setStats(statsRes.data.items);
			setScripts(scriptsRes.data.items);
			setExecutions(executionsRes.data.items);
		} catch (error) {
			console.error("Error loading data:", error);
		}
	};

	useEffect(() => {
		loadData();
		const interval = setInterval(loadData, 5000);
		return () => clearInterval(interval);
	}, []);

	const handleCreate = () => {
		setSelectedScript(null);
		setIsModalOpen(true);
	};

	const handleEdit = (script: Script) => {
		setSelectedScript(script);
		setIsModalOpen(true);
	};

	const handleDelete = async (id: string) => {
		if (confirm("Are you sure you want to delete this script?")) {
			try {
				await apiScript.delete(id);
				loadData();
			} catch (error) {
				console.error("Error deleting script:", error);
			}
		}
	};

	const handleExecute = (script: Script) => {
		setSelectedScript(script);
		setIsExecuting(true);
	};

	const handleBackFromExecution = () => {
		setIsExecuting(false);
		setSelectedScript(null);
		loadData(); // Refresh data after execution
	};

	const viewExecution = (execution: Execution) => {
		setSelectedExecution(execution);
		setIsExecutionModalOpen(true);
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<main className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 pt-[94px] pb-8">				{isExecuting ? (
				<LiveExecution
					script={selectedScript}
					onBack={handleBackFromExecution}
				/>
			) : (
				<>
					{/* Stats Cards */}
					{stats && (
						<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
							<StatCard
								title="Total Scripts"
								value={stats.total_scripts}
								icon={<Code className="w-6 h-6" />}
								color="blue"
							/>
							<StatCard
								title="Total Runs"
								value={stats.total_executions}
								icon={<Clock className="w-6 h-6" />}
								color="gray"
							/>
							<StatCard
								title="Successful"
								value={stats.successful_executions}
								icon={<CheckCircle className="w-6 h-6" />}
								color="green"
							/>
							<StatCard
								title="Failed"
								value={stats.failed_executions}
								icon={<XCircle className="w-6 h-6" />}
								color="red"
							/>
							<StatCard
								title="Running"
								value={stats.running_executions}
								icon={<Loader className="w-6 h-6" />}
								color="yellow"
							/>
						</div>
					)}

					{/* Scripts Section */}
					<div className="bg-white rounded-sm shadow-sm border mb-8">
						<div className="p-6 border-b flex items-center justify-between">
							<h2 className="text-xl font-semibold text-gray-900">Scripts</h2>
							<button
								type="button"
								onClick={handleCreate}
								className="flex items-center gap-1 px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-700 transition-colors"
							>
								<Plus className="w-5 h-5" />
								Script
							</button>
						</div>
						<div className="p-6">
							{scripts.length === 0 ? (
								<div className="text-center py-12">
									<Code className="w-16 h-16 text-gray-300 mx-auto mb-4" />
									<p className="text-gray-500">
										No scripts yet. Create your first script!
									</p>
								</div>
							) : (
								<div className="grid gap-4">
									{scripts.map((script) => (
										<ScriptCard
											key={script.id}
											script={script}
											onEdit={handleEdit}
											onDelete={handleDelete}
											onExecute={handleExecute}
										/>
									))}
								</div>
							)}
						</div>
					</div>

					{/* Executions Section */}
					<div className="bg-white rounded-sm shadow-sm border">
						<div className="p-6 border-b">
							<h2 className="text-xl font-semibold text-gray-900">
								Recent Executions
							</h2>
						</div>
						<div className="overflow-x-auto">
							{executions.length === 0 ? (
								<div className="text-center py-12">
									<Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
									<p className="text-gray-500">
										No executions yet. Run a script to see results!
									</p>
								</div>
							) : (
								<table className="w-full">
									<thead className="bg-gray-50">
										<tr>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Script
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Started
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Duration
											</th>
											<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{executions.slice(0, 10).map((execution) => (
											<ExecutionRow
												key={execution.id}
												execution={execution}
												onView={viewExecution}
											/>
										))}
									</tbody>
								</table>
							)}
						</div>
					</div>
				</>
			)}
			</main>

			<ScriptModal
				data={selectedScript}
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSuccess={() => loadData()}
				isExecuting={isExecuting}
			/>

			{/* Execution Details Modal */}
			<DetailModal
				data={selectedExecution}
				isOpen={isExecutionModalOpen}
				onClose={() => setIsExecutionModalOpen(false)}
			/>

		</div>
	);
}

export default App;
