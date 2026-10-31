import { useState } from 'react';
import {
  Plus,
  User,
  CreditCard,
  Search,
  Check
} from 'lucide-react';
import {
  Card,
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
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui';
import { useWeddingStore } from '../store/useWeddingStore';

interface Task {
  id: string;
  weddingId: string;
  title: string;
  category: 'FINANCE' | 'VENUE' | 'VENDORS' | 'DESIGN' | 'PERMITS' | 'DAY_OF';
  owner: string;
  stage: 'DONE' | 'IN_PROGRESS' | 'TO_PLAN';
  stagePayment?: string;
  daysBefore: string;
}

export const Tasks: React.FC = () => {
  const { weddings, selectedWeddingId } = useWeddingStore();
  const [activeStageFilter, setActiveStageFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  // New task form state
  const [newTaskWeddingId, setNewTaskWeddingId] = useState<string>(
    selectedWeddingId !== 'ALL' ? selectedWeddingId : 'RW-2026-001'
  );
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<Task['category']>('VENUE');
  const [newOwner, setNewOwner] = useState('Devika Sharma');
  const [newDays, setNewDays] = useState('20 Days');

  const [tasks, setTasks] = useState<Task[]>([
    { id: 'TSK-01', weddingId: 'RW-2026-001', title: 'Collect Booking Deposit (20%)', category: 'FINANCE', owner: 'Finance Team', stage: 'DONE', stagePayment: 'Stage 1: Booking Deposit', daysBefore: '90 Days' },
    { id: 'TSK-02', weddingId: 'RW-2026-001', title: 'Lock Palace Venue Contract & Heritage Permits', category: 'VENUE', owner: 'Devika Sharma', stage: 'DONE', daysBefore: '75 Days' },
    { id: 'TSK-03', weddingId: 'RW-2026-001', title: 'Issue Catering RFQ for 400 Guests', category: 'VENDORS', owner: 'Devika Sharma', stage: 'DONE', daysBefore: '60 Days' },
    { id: 'TSK-04', weddingId: 'RW-2026-001', title: 'Award Catering Contract & Sign SLA', category: 'VENDORS', owner: 'Devika Sharma', stage: 'DONE', daysBefore: '50 Days' },
    { id: 'TSK-05', weddingId: 'RW-2026-001', title: 'Collect Pre-Wedding Advance Payment (50%)', category: 'FINANCE', owner: 'Finance Team', stage: 'IN_PROGRESS', stagePayment: 'Stage 2: Advance (1 Mo Before)', daysBefore: '30 Days' },
    { id: 'TSK-06', weddingId: 'RW-2026-001', title: 'Finalize Mehendi Floral Concept & Folk Dancers', category: 'DESIGN', owner: 'Aarav Mehta', stage: 'IN_PROGRESS', daysBefore: '25 Days' },
    { id: 'TSK-07', weddingId: 'RW-2026-001', title: 'Sangeet Stage Lighting Truss & DJ Tech Rider', category: 'DESIGN', owner: 'Karan Verma', stage: 'IN_PROGRESS', daysBefore: '20 Days' },
    { id: 'TSK-08', weddingId: 'RW-2026-001', title: 'Royal Elephant & Drummers Baraat Route Clearance', category: 'PERMITS', owner: 'Karan Verma', stage: 'TO_PLAN', daysBefore: '15 Days' },
    { id: 'TSK-09', weddingId: 'RW-2026-001', title: 'Mandap Structural & Fire Safety Certification', category: 'VENUE', owner: 'Aarav Mehta', stage: 'TO_PLAN', daysBefore: '10 Days' },
    { id: 'TSK-10', weddingId: 'RW-2026-001', title: 'Minute-by-Minute Run Sheet Distribution to Family', category: 'DAY_OF', owner: 'Priya Joshi', stage: 'TO_PLAN', daysBefore: '5 Days' },
    { id: 'TSK-11', weddingId: 'RW-2026-001', title: 'Post-Event Banquet Headcount Audit (+ Extras)', category: 'FINANCE', owner: 'Finance Team', stage: 'TO_PLAN', stagePayment: 'Stage 3: Final Settlement', daysBefore: '+1 Day' },
    { id: 'TSK-12', weddingId: 'RW-2026-001', title: 'Disburse Final Vendor Balance Payments', category: 'FINANCE', owner: 'Finance Team', stage: 'TO_PLAN', daysBefore: '+3 Days' },
    // Tasks for Wedding 2 (Jaipur Heritage)
    { id: 'TSK-13', weddingId: 'RW-2026-002', title: 'Sign Rambagh Palace Lawn Booking Contract', category: 'VENUE', owner: 'Devika Sharma', stage: 'DONE', daysBefore: '80 Days' },
    { id: 'TSK-14', weddingId: 'RW-2026-002', title: 'Review 3 Caterers Side-by-Side Tasting Notes', category: 'VENDORS', owner: 'Devika Sharma', stage: 'IN_PROGRESS', daysBefore: '45 Days' },
    { id: 'TSK-15', weddingId: 'RW-2026-002', title: 'Collect Pre-Wedding Advance Payment (50%)', category: 'FINANCE', owner: 'Finance Team', stage: 'TO_PLAN', stagePayment: 'Stage 2: Advance', daysBefore: '30 Days' },
    // Tasks for Wedding 3 (Fortress Chic)
    { id: 'TSK-16', weddingId: 'RW-2026-003', title: 'Alila Fort Bishangarh Day-of Logistics & Check-in Desk', category: 'DAY_OF', owner: 'Karan Verma', stage: 'TO_PLAN', daysBefore: '20 Days' },
  ]);

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStage: Task['stage'] =
            t.stage === 'DONE' ? 'TO_PLAN' : t.stage === 'TO_PLAN' ? 'IN_PROGRESS' : 'DONE';
          return { ...t, stage: nextStage };
        }
        return t;
      })
    );
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newTask: Task = {
      id: `TSK-${String(tasks.length + 1).padStart(2, '0')}`,
      weddingId: newTaskWeddingId,
      title: newTitle,
      category: newCategory,
      owner: newOwner,
      stage: 'TO_PLAN',
      daysBefore: newDays,
    };

    setTasks([...tasks, newTask]);
    setModalOpen(false);
    setNewTitle('');
  };

  const filtered = tasks.filter((t) => {
    const matchesWedding = selectedWeddingId === 'ALL' || t.weddingId === selectedWeddingId;
    const matchesStage = activeStageFilter === 'ALL' || t.stage === activeStageFilter;
    const matchesSearch =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesWedding && matchesStage && matchesSearch;
  });

  const activeWedding = weddings.find((w) => w.id === selectedWeddingId);

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Project Task Management
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono font-bold text-[#714B67]">
              {activeWedding ? `${activeWedding.code}: ${activeWedding.couple}` : 'All 25 Weddings'}
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Checklists & Stage Milestones
          </h1>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Task</span>
        </Button>
      </div>

      {/* Odoo Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search task, owner, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs border-slate-300"
          />
        </div>

        <Tabs value={activeStageFilter} onValueChange={setActiveStageFilter} className="w-full md:w-auto">
          <TabsList className="h-8 bg-slate-100 border border-slate-200">
            <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
              All Tasks ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="TO_PLAN" className="text-xs px-3 font-semibold">
              To Plan ({tasks.filter((t) => t.stage === 'TO_PLAN').length})
            </TabsTrigger>
            <TabsTrigger value="IN_PROGRESS" className="text-xs px-3 font-semibold">
              In Progress ({tasks.filter((t) => t.stage === 'IN_PROGRESS').length})
            </TabsTrigger>
            <TabsTrigger value="DONE" className="text-xs px-3 font-semibold">
              Completed ({tasks.filter((t) => t.stage === 'DONE').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tasks Table */}
      <Card className="border border-slate-200 shadow-2xs rounded bg-white">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="w-12 text-center font-bold text-slate-700 text-xs">Status</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Task Name & Identifier</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Category</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Owner</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Timeline</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs">Linked Payment Milestone</TableHead>
                <TableHead className="font-bold text-slate-700 text-xs text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filtered.map((t) => {
                const isDone = t.stage === 'DONE';
                const isInProgress = t.stage === 'IN_PROGRESS';

                return (
                  <TableRow key={t.id} className="hover:bg-slate-50 transition">
                    <TableCell className="text-center py-2.5">
                      <button
                        onClick={() => toggleTaskStatus(t.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition cursor-pointer mx-auto ${isDone
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : isInProgress
                            ? 'bg-amber-100 border-amber-500 text-amber-800'
                            : 'border-slate-300 hover:border-slate-500 bg-white'
                          }`}
                      >
                        {isDone && <Check className="w-3 h-3" />}
                        {isInProgress && <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />}
                      </button>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className={`font-semibold text-xs ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {t.title}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.id}</div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {t.category}
                      </Badge>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{t.owner}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 font-mono text-xs text-slate-600">
                      {t.daysBefore}
                    </TableCell>

                    <TableCell className="py-2.5">
                      {t.stagePayment ? (
                        <Badge variant="odoo" className="text-[10px] gap-1 font-mono">
                          <CreditCard className="w-3 h-3 text-[#714B67]" />
                          {t.stagePayment}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTaskStatus(t.id)}
                        className="h-6 text-xs text-slate-700"
                      >
                        {t.stage.replace('_', ' ')}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal: Add Custom Task */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Create Project Task
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Attach specialized operational task to event checklist.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTask} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="task_wedding">Related Wedding Project</Label>
              <select
                id="task_wedding"
                value={newTaskWeddingId}
                onChange={(e) => setNewTaskWeddingId(e.target.value)}
                className="w-full h-8 text-xs font-semibold bg-white border border-slate-300 rounded px-2.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#714B67]"
              >
                {weddings.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.code}: {w.couple} ({w.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="task_title">Task Description</Label>
              <Input
                id="task_title"
                placeholder="e.g. Vintage Car Baraat Escort Permits"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="cat">Category</Label>
                <Select
                  value={newCategory}
                  onValueChange={(val) => setNewCategory(val as any)}
                >
                  <SelectTrigger id="cat" className="h-8 text-xs border-slate-300">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FINANCE">FINANCE</SelectItem>
                    <SelectItem value="VENUE">VENUE</SelectItem>
                    <SelectItem value="VENDORS">VENDORS</SelectItem>
                    <SelectItem value="DESIGN">DESIGN</SelectItem>
                    <SelectItem value="PERMITS">PERMITS</SelectItem>
                    <SelectItem value="DAY_OF">DAY_OF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="timeline">Timeline (Days Before)</Label>
                <Input
                  id="timeline"
                  placeholder="e.g. 15 Days"
                  value={newDays}
                  onChange={(e) => setNewDays(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="owner">Assignee Owner</Label>
              <Input
                id="owner"
                placeholder="Devika Sharma"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Add to Checklist
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
