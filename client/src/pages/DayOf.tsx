import { useState } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  User, 
  Clock
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';

interface Incident {
  id: string;
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTo: string;
  status: 'INVESTIGATING' | 'RESOLVED';
  time: string;
}

interface ScheduleItem {
  time: string;
  event: string;
  venue: string;
  owner: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'UPCOMING';
}

interface VendorCheckin {
  vendor: string;
  category: string;
  scheduled: string;
  actual: string;
  status: 'ARRIVED_ON_TIME' | 'RUNNING_LATE';
  delay: number;
}

export const DayOf: React.FC = () => {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSeverity, setNewSeverity] = useState<'HIGH' | 'MEDIUM'>('HIGH');
  const [newAssignee, setNewAssignee] = useState('Karan Verma');

  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'INC-01',
      title: 'Florist needs extra backup generator for mandap spotlights',
      severity: 'HIGH',
      assignedTo: 'Karan Verma',
      status: 'INVESTIGATING',
      time: '14:20',
    },
    {
      id: 'INC-02',
      title: 'Bride convoy car slowed down by old city bazaar traffic (15 min delay)',
      severity: 'MEDIUM',
      assignedTo: 'Priya Joshi',
      status: 'RESOLVED',
      time: '14:05',
    },
  ]);

  const [schedule] = useState<ScheduleItem[]>([
    { time: '14:00', event: 'Groom Baraat Assembly & Royal Vintage Car Lineup', venue: 'Palace South Gate', owner: 'Karan Verma', status: 'COMPLETED' },
    { time: '15:15', event: 'Grand Varmala (Garland Exchange) over Lake Courtyard', venue: 'Lake Front Terrace', owner: 'Devika Sharma', status: 'IN_PROGRESS' },
    { time: '16:30', event: 'Royal Vedic Pheras & Mangalsutra Ritual', venue: 'Heritage Mandap Hall', owner: 'Priya Joshi', status: 'UPCOMING' },
    { time: '19:30', event: 'Banquet Reception Gala & Family Speeches', venue: 'Grand Durbar Hall', owner: 'Devika Sharma', status: 'UPCOMING' },
  ]);

  const vendorCheckins: VendorCheckin[] = [
    { vendor: 'Royal Mewar Banquets', category: 'Catering (400 Guests)', scheduled: '12:00 PM', actual: '11:45 AM', status: 'ARRIVED_ON_TIME', delay: 0 },
    { vendor: 'Desert Beat Sounds', category: 'DJ & Production', scheduled: '13:00 PM', actual: '13:40 PM', status: 'RUNNING_LATE', delay: 40 },
    { vendor: 'Jaipur Floral Wonders', category: 'Mandap & Courtyard Decor', scheduled: '10:00 AM', actual: '09:50 AM', status: 'ARRIVED_ON_TIME', delay: 0 },
    { vendor: 'Heritage Dhol Troupe', category: 'Baraat Drummers', scheduled: '13:30 PM', actual: '13:25 PM', status: 'ARRIVED_ON_TIME', delay: 0 },
  ];

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newInc: Incident = {
      id: `INC-0${incidents.length + 1}`,
      title: newTitle,
      severity: newSeverity,
      assignedTo: newAssignee,
      status: 'INVESTIGATING',
      time: '14:35',
    };

    setIncidents([newInc, ...incidents]);
    setReportModalOpen(false);
    setNewTitle('');
  };

  const handleResolveIncident = (id: string) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'RESOLVED' } : i))
    );
  };

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Field Operations
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Day-Of Live Execution & Incident Log
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono font-bold py-1 px-2.5">
            Singhania & Mehra Wedding
          </Badge>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setReportModalOpen(true)}
            className="gap-1.5"
          >
            <span>Log Incident</span>
          </Button>
        </div>
      </div>

      {/* Incidents Command Bar */}
      <Card className="border border-rose-200 bg-rose-50/40 shadow-2xs rounded">
        <CardHeader className="p-3.5 pb-2 border-b border-rose-200/80 bg-rose-50">
          <div className="flex items-center justify-between">
            <div className="font-bold text-xs uppercase tracking-wider text-rose-900">
              Active Operational Incidents
            </div>
            <Badge variant="destructive" className="text-[10px] font-mono">
              {incidents.filter((i) => i.status === 'INVESTIGATING').length} Pending
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-3.5 space-y-2">
          {incidents.map((inc) => (
            <div
              key={inc.id}
              className="p-3 rounded bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Badge
                  variant={inc.severity === 'HIGH' ? 'destructive' : 'warning'}
                  className="text-[10px] font-mono uppercase"
                >
                  {inc.severity}
                </Badge>
                <span className="font-bold text-slate-900">{inc.title}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-slate-500 text-[11px]">
                  Assigned: <strong className="text-slate-800">{inc.assignedTo}</strong> ({inc.time})
                </span>
                {inc.status === 'INVESTIGATING' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResolveIncident(inc.id)}
                    className="h-6 text-xs text-emerald-800 border-emerald-300 bg-emerald-50"
                  >
                    Mark Resolved
                  </Button>
                ) : (
                  <Badge variant="success" className="text-[10px]">
                    Resolved
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Run Sheet & Vendor Arrivals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Minute-by-Minute Run Sheet */}
        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Minute-by-Minute Run Sheet
                </CardTitle>
                <div className="text-xs text-slate-500">
                  Execution schedule for Nov 15, 2026
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                Live Timeline
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-3">
            <div className="space-y-3">
              {schedule.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-start relative pb-2 border-b border-slate-100 last:border-0 last:pb-0">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border shrink-0 mt-0.5 ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-700 border-emerald-700 text-white'
                        : item.status === 'IN_PROGRESS'
                        ? 'bg-[#714B67] border-[#714B67] text-white'
                        : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}
                  >
                    {item.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {item.time}
                      </span>
                      <Badge
                        variant={
                          item.status === 'COMPLETED'
                            ? 'success'
                            : item.status === 'IN_PROGRESS'
                            ? 'odoo'
                            : 'secondary'
                        }
                        className="text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    <div className="font-bold text-xs text-slate-900 mt-0.5">
                      {item.event}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{item.venue}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{item.owner}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Vendor Check-in & Telemetry */}
        <Card className="border border-slate-200 shadow-2xs rounded bg-white">
          <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">
                  Vendor Arrival Telemetry
                </CardTitle>
                <div className="text-xs text-slate-500">
                  Delivery timing and punctuality records
                </div>
              </div>
              <Badge variant="outline" className="text-xs font-mono font-bold">
                4 Vendors
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 text-xs">Vendor & Service</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Scheduled</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs">Actual</TableHead>
                  <TableHead className="font-bold text-slate-700 text-xs text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {vendorCheckins.map((v, i) => (
                  <TableRow key={i} className="hover:bg-slate-50 transition">
                    <TableCell className="py-2.5">
                      <div className="font-bold text-xs text-slate-900">{v.vendor}</div>
                      <div className="text-[11px] text-slate-500">{v.category}</div>
                    </TableCell>

                    <TableCell className="py-2.5 font-mono text-xs text-slate-600">
                      {v.scheduled}
                    </TableCell>

                    <TableCell className="py-2.5 font-mono text-xs font-bold text-slate-800">
                      {v.actual}
                    </TableCell>

                    <TableCell className="py-2.5 text-right">
                      {v.status === 'ARRIVED_ON_TIME' ? (
                        <Badge variant="success" className="text-[10px]">
                          On Time
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          +{v.delay}m Late
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Report Incident */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Log Field Incident
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Broadcast critical event issue to coordinators and field staff.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReportIncident} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="inc_title">Incident Description</Label>
              <Input
                id="inc_title"
                placeholder="e.g. Generator failure at Mandap lawn"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="severity">Severity Level</Label>
                <Select
                  value={newSeverity}
                  onValueChange={(val) => setNewSeverity(val as 'HIGH' | 'MEDIUM')}
                >
                  <SelectTrigger id="severity" className="h-8 text-xs border-slate-300">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">HIGH (Immediate Action)</SelectItem>
                    <SelectItem value="MEDIUM">MEDIUM (Delay Risk)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="assignee">Lead Responder</Label>
                <Input
                  id="assignee"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setReportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" size="sm">
                Log & Dispatch
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
