import Modal from './Modal'
import type { Execution } from '@/types';

export type DetailModalType = {
    data?: Execution | null;
    isOpen: boolean;
    onClose: () => void;
    onError?: any;
    onSuccess?: any;
    isExecuting?: boolean;
};

function DetailModal({ data, isOpen, onClose }: DetailModalType) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Execution Details"
        >
            {data && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Script</p>
                            <p className="text-base font-semibold text-gray-900">
                                {data.script_name}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Status</p>
                            <p className="text-base font-semibold text-gray-900 capitalize">
                                {data.status}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Started</p>
                            <p className="text-base text-gray-900">
                                {new Date(data.started_at).toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Exit Code</p>
                            <p className="text-base text-gray-900">
                                {data.exit_code ?? "N/A"}
                            </p>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Output</p>
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-sm overflow-x-auto text-sm font-mono">
                            {data.output || "(no output)"}
                        </pre>
                    </div>

                    {data.error && (
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-2">Error</p>
                            <pre className="bg-red-50 text-red-900 p-4 rounded-sm overflow-x-auto text-sm font-mono border border-red-200">
                                {data.error}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    )
}

export default DetailModal