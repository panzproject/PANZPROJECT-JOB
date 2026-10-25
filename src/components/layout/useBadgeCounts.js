import { useApp } from '../../store/AppContext';
export function useBadgeCounts() {
    const { state } = useApp();
    return {
        available: state.jobs.filter((job) => job.status === 'AVAILABLE' && !job.paused).length,
        review: state.jobs.filter((job) => ['SUBMITTED', 'UNDER_REVIEW', 'EXPIRY_REVIEW'].includes(job.status)).length,
        withdrawals: state.withdrawals.filter((item) => item.status === 'PENDING').length,
        notifications: state.notifications.filter((item) => !item.read).length,
        pendingSellers: state.sellers.filter((seller) => seller.status === 'PENDING').length,
    };
}
