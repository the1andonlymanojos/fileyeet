export default function FileDetails({ selectedFile, handleCancel }: any) {
    return (
        selectedFile && (
            <div className="flex flex-col md:min-w-72 items-center justify-center space-y-2 relative z-10">
                <p className="text-gray-600 dark:text-gray-300">
                    {selectedFile.name} <br></br>({(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
                <button
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
            </div>
        )
    );
}
