import React from 'react';
import { History, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../ui';
import type { LiveChangelog } from './types';

interface AuditChangelogTabProps {
  changelog: LiveChangelog[];
}

export const AuditChangelogTab: React.FC<AuditChangelogTabProps> = ({ changelog }) => {
  return (
    <Card className="border-slate-200 shadow-2xs overflow-hidden">
      <CardHeader className="p-4 bg-slate-50/70 border-b border-slate-200">
        <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-[#714B67]" />
          Commercial Audit Trail & Activity Changelog
        </CardTitle>
        <p className="text-xs text-slate-500 mt-0.5">
          Immutable ledger history documenting all vendor bill approvals, milestone collections, charge overruns, and settlement sign-offs.
        </p>
      </CardHeader>

      <div className="p-5">
        {changelog.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Clock className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
            <p className="text-xs font-semibold text-slate-600">No activity logged yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Transactions, payments, and extra charge additions will automatically appear in this audit trail.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {changelog.map((log) => (
              <div key={log.id} className="relative group">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#714B67] ring-4 ring-white" />

                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 text-[#714B67]">
                        {log.entityType}
                      </span>
                      {log.amount && (
                        <span className="font-mono text-emerald-700 font-bold">
                          {log.amount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {log.createdAt}
                    </span>
                  </div>

                  <p className="text-slate-700 font-medium mt-1">
                    {log.notes || 'Transaction logged'}
                  </p>

                  <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 flex items-center justify-between">
                    <span>Authorized By: <strong className="text-slate-600">{log.performedBy}</strong></span>
                    {log.toStatus && (
                      <span>Status Transition: <strong className="text-[#714B67]">{log.toStatus}</strong></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
