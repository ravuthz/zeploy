import { useEffect, useState } from 'react'
import { Save } from "lucide-react";

import Modal from './Modal';

import { apiScript } from '@/api';
import type { Script } from '@/types';

export type ScriptModalType = {
    data?: Script | null;
    isOpen: boolean;
    onClose: () => void;
    onError?: any;
    onSuccess?: any;
    isExecuting?: boolean;
};

function ScriptModal({ isOpen, onClose, onError, onSuccess, data, isExecuting }: ScriptModalType) {

    const [formData, setFormData] = useState({
        name: "",
        tags: "",
        content: "",
        description: "",
    });

    useEffect(() => {
        if (data) {
            setFormData({
                name: data.name,
                tags: data.tags.join(", "),
                content: data.content,
                description: data.description,
            });
        } else {
            setFormData({
                name: "",
                tags: "",
                content: "",
                description: "",
            });
        }
    }, [data]);

    const handleSubmit = async () => {
        try {
            const input = {
                name: formData.name,
                description: formData.description,
                content: formData.content,
                tags: formData.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter((t) => t),
            };

            if (!isExecuting) {
                apiScript.save(input, data?.id)
                    .then(onSuccess)
                    .catch(onError);
            }
        } catch (error) {
            console.error("Error saving script:", error);
            alert("Error saving script. Please try again.");
        } finally {
            onClose();
        }
    };


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                data && !isExecuting ? "Edit Script" : "Create Script"
            }
        >
            <div className="space-y-4">
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Script Name
                    </label>
                    <input
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="my-script"
                    />
                </div>

                <div>
                    <label
                        htmlFor="description"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Description
                    </label>
                    <input
                        name="description"
                        type="text"
                        value={formData.description}
                        onChange={(e) =>
                            setFormData({ ...formData, description: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="What does this script do?"
                    />
                </div>

                <div>
                    <label
                        htmlFor="tags"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Tags (comma-separated)
                    </label>
                    <input
                        name="tags"
                        type="text"
                        value={formData.tags}
                        onChange={(e) =>
                            setFormData({ ...formData, tags: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="backup, automation, daily"
                    />
                </div>

                <div>
                    <label
                        htmlFor="content"
                        className="block text-sm font-medium text-gray-700 mb-2"
                    >
                        Script Content
                    </label>
                    <textarea
                        name="content"
                        value={formData.content}
                        onChange={(e) =>
                            setFormData({ ...formData, content: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                        rows={9}
                        placeholder="#!/bin/bash&#10;echo 'Hello World'"
                    />
                </div>

                <div className="flex gap-3 pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-sm hover:bg-blue-700 transition-colors"
                    >
                        <Save className="w-5 h-5" />
                        {data && !isExecuting
                            ? "Update Script"
                            : "Create Script"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-sm hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    )
}

export default ScriptModal