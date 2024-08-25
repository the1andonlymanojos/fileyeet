import Link from 'next/link';

export default function Home() {
    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-6 sm:p-10">
            <header className="text-center">
                <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-6">
                    Welcome to FileYeet
                </h1>
                <p className="text-xl text-gray-700 dark:text-gray-300 max-w-xl mx-auto mb-10">
                    Share files directly with your peers, without the middleman. No servers, no snooping. Just secure,
                    encrypted, peer-to-peer file sharing. Your privacy, your control.
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-center gap-4 mb-10">
                    <Link href="/share">
                        <div
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
                            Start Sharing
                        </div>
                    </Link>
                    <Link href="/recieve">
                        <div
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-300">
                            Receive Files
                        </div>
                    </Link>
                </div>
            </header>

            <section className="mt-12 text-center">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    Why FileYeet?
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12">
                    FileYeet was created with privacy and simplicity in mind. Here&apos;s why it&apos;s the right choice:
                </p>
                <ul className="text-left list-disc list-inside text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-12 space-y-2">
                    <li>No tracking or data analysis—your files remain private.</li>
                    <li>Direct file transfers—no slow uploads to cloud services.</li>
                    <li>End-to-end encryption—ensuring your files are secure.</li>
                    <li>Easy to use—just select your file and share with a peer.</li>
                </ul>
            </section>

            <section className="mt-12">
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6 text-center">
                    A Little Humor
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 max-w-3xl mx-auto mb-10 text-center">
                    Because, let’s face it, file sharing can be ridiculous sometimes. But we’re here to make it easy, no
                    matter what.
                </p>
                <div className="flex justify-center">
                    <img
                        src="https://imgs.xkcd.com/comics/file_transfer.png"
                        alt="File Transfer"
                        className="w-full max-w-lg rounded-lg shadow-lg"
                    />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-6">
                    Source: <a href="https://xkcd.com/949/" className="underline">xkcd</a>
                </p>
            </section>

            <footer className="mt-16 text-center text-gray-600 dark:text-gray-400">
                <p>&copy; 2024 FileYeet. All rights reserved.</p>
            </footer>
        </div>
    );
}
