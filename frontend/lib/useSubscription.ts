import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import { useAuth } from '@/components/AuthProvider';

export type PlanTier = 'personal' | 'starter' | 'pro' | 'custom';

export interface SubscriptionData {
    plan: PlanTier;
    status: 'active' | 'expired' | 'trial';
    expiresAt: number; // timestamp
    startedAt: number; // timestamp
    maxSessions: number;
    allowApi: boolean;
    maxMsgsPerDay: number;
}

export const PLAN_LIMITS: Record<PlanTier, Partial<SubscriptionData>> = {
    personal: {
        maxSessions: 1,
        allowApi: false,
        maxMsgsPerDay: 200,
    },
    starter: {
        maxSessions: 2,
        allowApi: false,
        maxMsgsPerDay: 1000,
    },
    pro: {
        maxSessions: 10,
        allowApi: true,
        maxMsgsPerDay: 50000, // Effectively unlimited for small-medium load
    },
    custom: {
        maxSessions: 100,
        allowApi: true,
        maxMsgsPerDay: 100000,
    }
};

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user?.uid) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const sub = data.subscription || {};

                const plan: PlanTier = sub.plan || 'personal'; // Default to personal
                const expiresAt = sub.expiresAt?.seconds ? sub.expiresAt.seconds * 1000 : Date.now() + (365 * 24 * 60 * 60 * 1000); // Default to long if missing
                const status = sub.status || 'active';

                // If no sub data exists in DB, we treat as personal active (fallback)
                const finalSub: SubscriptionData = {
                    plan,
                    status: Date.now() > expiresAt ? 'expired' : status,
                    expiresAt,
                    startedAt: sub.startedAt?.seconds ? sub.startedAt.seconds * 1000 : Date.now(),
                    ...PLAN_LIMITS[plan]
                } as SubscriptionData;

                setSubscription(finalSub);
            } else {
                // If user doc doesn't exist, assume personal plan for now (safe fallback)
                setSubscription({
                    plan: 'personal',
                    status: 'active',
                    expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000),
                    startedAt: Date.now(),
                    ...PLAN_LIMITS['personal']
                } as SubscriptionData);
            }
            setLoading(false);
        }, (err) => {
            console.error("Subscription feed error:", err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.uid]);

    const isExpired = subscription?.status === 'expired' || (subscription?.expiresAt ? Date.now() > subscription.expiresAt : false);
    const daysLeft = subscription?.expiresAt ? Math.ceil((subscription.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    return {
        subscription,
        loading,
        isExpired,
        daysLeft,
        isActive: !!subscription && !isExpired
    };
}
