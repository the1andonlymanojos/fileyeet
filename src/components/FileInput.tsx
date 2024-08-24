"use client";

import { useRef } from "react";

export default function FileInput({ selectedFile, handleFileClick, handleFileDrop, handleFileChange }: any) {
    const fileInputRef = useRef(null);

    return (
        <div
            className="border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg p-10 relative overflow-hidden
            bg-white dark:bg-gray-800 hover:bg-gray-100 hover:dark:bg-gray-600 ease-in-out transition-colors duration-500
            aspect-square max-w-72 flex flex-col justify-center items-center"
            onClick={!selectedFile ? handleFileClick : undefined}
            onDrop={handleFileDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            {!selectedFile ? (
                <div className="flex flex-col items-center justify-center space-y-2 relative z-10">
                    <div className="text-orange-500 text-4xl">+</div>
                    <p className="text-gray-600 dark:text-gray-300">
                        Click to browse or drag files here to start sharing
                    </p>
                </div>
            ) : (
                <div className="flex flex-col md:min-w-72 items-center justify-center space-y-2 relative z-10">
                    <p className="text-gray-600 dark:text-gray-300">
                        {selectedFile.name} <br></br>({(selectedFile.size / 1024).toFixed(2)} KB)
                    </p>
                </div>
            )}
            <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
            />
        </div>
    );
}
