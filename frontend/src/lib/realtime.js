import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { queryClient } from './queryClient';
import { toast } from 'sonner';
let socket = null;
const activeAuctionRooms = new Set();
export function getRealtimeSocket() {
  if (!socket) {
    socket = io(window.location.origin, {
      path: '/socket.io',
      auth: (cb) => {
        const token = localStorage.getItem('vutto_access_token') || '';
        cb({ token });
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
    socket.on('connect', () => {
      for (const auctionId of activeAuctionRooms) {
        socket?.emit('join:auction', { auctionId });
      }
    });
    socket.on('bid:placed', (payload) => {
      if (payload?.auctionId) {
        queryClient.setQueryData(['auction', payload.auctionId], (old) => {
          if (!old) return old;
          return {
            ...old,
            currentBid: payload.currentPrice ?? old.currentBid,
            totalBids: payload.bidCount ?? old.totalBids,
            endsAt: payload.endsAt ?? old.endsAt,
            version: payload.version ?? old.version,
          };
        });
        if (payload.bid) {
          queryClient.setQueryData(['bids'], (oldBids) => {
            if (!oldBids) return [payload.bid];
            if (oldBids.some((b) => b.id === payload.bid.id)) return oldBids;
            return [payload.bid, ...oldBids];
          });
        }
        void queryClient.invalidateQueries({
          queryKey: ['auction', payload.auctionId],
        });
        void queryClient.invalidateQueries({ queryKey: ['auctions'] });
        void queryClient.invalidateQueries({ queryKey: ['bids'] });
        void queryClient.invalidateQueries({ queryKey: ['my-bids'] });
        void queryClient.invalidateQueries({ queryKey: ['admin-data'] });
        window.dispatchEvent(
          new CustomEvent('vutto-bid-placed', { detail: payload })
        );
      }
    });
    socket.on('auction:extended', (payload) => {
      if (payload?.auctionId) {
        queryClient.setQueryData(['auction', payload.auctionId], (old) => {
          if (!old) return old;
          return { ...old, endsAt: payload.endsAt };
        });
        void queryClient.invalidateQueries({
          queryKey: ['auction', payload.auctionId],
        });
        void queryClient.invalidateQueries({ queryKey: ['auctions'] });
        toast.info('Auction extended by 2 minutes (anti-sniping)!');
        window.dispatchEvent(
          new CustomEvent('vutto-auction-extended', { detail: payload })
        );
      }
    });
    socket.on('auction:ended', (payload) => {
      if (payload?.auctionId) {
        queryClient.setQueryData(['auction', payload.auctionId], (old) => {
          if (!old) return old;
          return { ...old, status: 'ENDED' };
        });
        void queryClient.invalidateQueries({
          queryKey: ['auction', payload.auctionId],
        });
        void queryClient.invalidateQueries({ queryKey: ['auctions'] });
        void queryClient.invalidateQueries({ queryKey: ['my-bids'] });
      }
    });
    socket.on('auction:status', (payload) => {
      if (payload?.auctionId) {
        queryClient.setQueryData(['auction', payload.auctionId], (old) => {
          if (!old) return old;
          return { ...old, status: payload.status };
        });
        void queryClient.invalidateQueries({
          queryKey: ['auction', payload.auctionId],
        });
        void queryClient.invalidateQueries({ queryKey: ['auctions'] });
      }
    });
    socket.on('outbid', (payload) => {
      toast.error(
        `You have been outbid! New highest bid is ₹${Number(payload.newAmount).toLocaleString('en-IN')}`
      );
      void queryClient.invalidateQueries({ queryKey: ['my-bids'] });
      if (payload?.auctionId) {
        void queryClient.invalidateQueries({
          queryKey: ['auction', payload.auctionId],
        });
      }
    });
  }
  return socket;
}
export function joinAuctionRoom(auctionId) {
  if (!auctionId) return;
  activeAuctionRooms.add(auctionId);
  const s = getRealtimeSocket();
  if (s.connected) {
    s.emit('join:auction', { auctionId });
  }
}
export function leaveAuctionRoom(auctionId) {
  if (!auctionId) return;
  activeAuctionRooms.delete(auctionId);
  const s = getRealtimeSocket();
  if (s.connected) {
    s.emit('leave:auction', { auctionId });
  }
}
export function updateSocketAuthToken(token) {
  if (socket) {
    socket.auth = { token };
    socket.disconnect().connect();
  }
}
export function useRealtimeStatus() {
  const [status, setStatus] = useState(() => {
    return socket?.connected ? 'connected' : 'disconnected';
  });
  useEffect(() => {
    const s = getRealtimeSocket();
    const handleConnect = () => setStatus('connected');
    const handleDisconnect = () => setStatus('disconnected');
    const handleConnectError = () => setStatus('disconnected');
    s.on('connect', handleConnect);
    s.on('disconnect', handleDisconnect);
    s.on('connect_error', handleConnectError);
    return () => {
      s.off('connect', handleConnect);
      s.off('disconnect', handleDisconnect);
      s.off('connect_error', handleConnectError);
    };
  }, []);
  return status;
}
