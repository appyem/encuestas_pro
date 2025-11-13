// src/components/PublicVotingWrapper.jsx
import React from 'react';
import { useParams } from 'react-router-dom';
import PublicVoting from './PublicVoting';

export default function PublicVotingWrapper() {
  const { pollId } = useParams();
  return <PublicVoting pollIdFromRoute={pollId} />;
}