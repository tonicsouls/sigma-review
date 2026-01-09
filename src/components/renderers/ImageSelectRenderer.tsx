
interface ImageSelectData {
    id: string;
    type: 'ImageSelect';
    question: string;
    options: {
        id: string;
        label: string;
        image?: string;
        isCorrect: boolean;
        feedback: string;
    }[];
}

interface ImageSelectRendererProps {
    data: ImageSelectData;
}

export function ImageSelectRenderer({ data }: ImageSelectRendererProps) {
    return (
        <div className="w-full max-w-3xl mx-auto my-8">
            <div className="bg-white border rounded-lg shadow-sm overflow-hidden p-6">
                <div className="mb-6 border-b pb-4">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold bg-purple-100 text-purple-700 mb-2">
                        🖼️ Image Select
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{data.question}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.options.map((option) => (
                        <div key={option.id} className="border rounded-lg p-3 hover:border-blue-500 cursor-pointer transition-colors group">
                            {option.image ? (
                                <img src={option.image} alt={option.label} className="w-full h-32 object-cover rounded mb-2 bg-gray-100" />
                            ) : (
                                <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center text-gray-400 text-sm">
                                    [Image Placeholder]
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-700 group-hover:text-blue-700">{option.label}</span>
                                {option.isCorrect && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Correct</span>}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 pl-1 border-l-2 border-gray-200">
                                {option.feedback}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
