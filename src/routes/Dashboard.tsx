import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReviewStore } from '../store/useReviewStore';
import { loadHourBlocks } from '../utils/dataLoader';
import type { Block } from '../types';

function Dashboard() {
    const navigate = useNavigate();
    const { corrections } = useReviewStore();
    const [stats, setStats] = useState({
        totalBlocks: 0,
        reviewedBlocks: 0,
        totalNotes: 0,
        pendingRegen: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStats() {
            // Currently scoping to Hour 1 for the proposal phase
            const blocks = await loadHourBlocks('1');

            // Calculate unique blocks that have corrections
            const blocksWithCorrections = new Set(corrections.map(c => c.blockId));

            setStats({
                totalBlocks: blocks.length,
                reviewedBlocks: blocksWithCorrections.size,
                totalNotes: corrections.length,
                pendingRegen: 0 // Placeholder for Phase 4
            });
            setLoading(false);
        }
        loadStats();
    }, [corrections]);

    const completionRate = stats.totalBlocks > 0
        ? Math.round((stats.reviewedBlocks / stats.totalBlocks) * 100)
        : 0;

    return (
                    <h3 className="text-gray-500 text-sm font-medium">Pending Regen</h3>
                    <p className="text-3xl font-bold mt-2 text-yellow-600">0</p>
                </div >
            </div >

        <div className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
            <p className="text-gray-500">Detailed statistics and charts coming soon...</p>
        </div>
        </div >
    );
}

export default Dashboard;
