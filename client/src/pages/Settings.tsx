import { useState } from 'react';
import { 
  Plus, 
  Layers,
  Edit
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

interface MasterCategory {
  category: string;
  label: string;
  items: { key: string; name: string; stages: string }[];
}

export const SettingsPage: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newName, setNewName] = useState('');
  const [newStages, setNewStages] = useState('');
  const [targetCategory, setTargetCategory] = useState('PACKAGE_TYPE');

  const [categories, setCategories] = useState<MasterCategory[]>([
    {
      category: 'PACKAGE_TYPE',
      label: 'Wedding Package Tiers',
      items: [
        { key: 'FULL_SERVICE', name: 'Full-Service Wedding (Complete planning)', stages: 'Deposit: 20%, Advance: 50%, Final: 30%' },
        { key: 'DAY_OF', name: 'Partial / Day-of Service', stages: 'Deposit: 30%, Advance: 40%, Final: 30%' },
      ],
    },
    {
      category: 'CEREMONY_TYPE',
      label: 'Royal Ceremonies & Sub-Events',
      items: [
        { key: 'MEHENDI', name: 'Mehendi Ceremony', stages: 'Floral & Henna' },
        { key: 'SANGEET', name: 'Sangeet Musical Night', stages: 'DJ, Lights & Stage' },
        { key: 'HALDI', name: 'Auspicious Haldi Ritual', stages: 'Morning setup' },
        { key: 'PHERAS', name: 'Varmala & Royal Pheras', stages: 'Mandap & Vedic' },
        { key: 'RECEPTION', name: 'Grand Royal Reception', stages: 'Banquet & Speeches' },
      ],
    },
  ]);

  const handleAddMaster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey || !newName) return;

    setCategories((prev) =>
      prev.map((c) =>
        c.category === targetCategory
          ? {
              ...c,
              items: [...c.items, { key: newKey.toUpperCase(), name: newName, stages: newStages || 'Standard' }],
            }
          : c
      )
    );

    setModalOpen(false);
    setNewKey('');
    setNewName('');
    setNewStages('');
  };

  return (
    <div className="space-y-4">
      {/* Odoo Control Panel */}
      <div className="bg-white border border-slate-200 rounded p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            System Administration
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            Configuration & Master Lookups
          </h1>
        </div>

        <Button
          variant="default"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Master Option</span>
        </Button>
      </div>

      {/* Master Configuration Tables */}
      <div className="space-y-4">
        {categories.map((cat) => (
          <Card key={cat.category} className="border border-slate-200 shadow-2xs rounded bg-white">
            <CardHeader className="p-3.5 border-b border-slate-200 bg-slate-50/70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#714B67]" />
                  <CardTitle className="text-sm font-bold text-slate-900">{cat.label}</CardTitle>
                </div>
                <Badge variant="outline" className="text-xs font-mono font-bold">
                  {cat.category}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-100/80 border-b border-slate-200">
                  <TableRow>
                    <TableHead className="font-bold text-slate-700 text-xs">Option Name</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Database Enum Key</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs">Milestones / Parameters</TableHead>
                    <TableHead className="font-bold text-slate-700 text-xs text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100">
                  {cat.items.map((item) => (
                    <TableRow key={item.key} className="hover:bg-slate-50 transition">
                      <TableCell className="font-bold text-xs text-slate-900 py-2.5">
                        {item.name}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-slate-600 py-2.5">
                        {item.key}
                      </TableCell>

                      <TableCell className="py-2.5">
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {item.stages}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right py-2.5">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-xs text-slate-700"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal: Add Master Option */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Add Master Lookup Record
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register new package tier or ceremony scope into system tables.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMaster} className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="master_cat">Category Scope</Label>
              <Select
                value={targetCategory}
                onValueChange={(val) => setTargetCategory(val)}
              >
                <SelectTrigger id="master_cat" className="h-8 text-xs border-slate-300">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PACKAGE_TYPE">Wedding Package Tiers</SelectItem>
                  <SelectItem value="CEREMONY_TYPE">Royal Ceremonies & Sub-Events</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="master_name">Display Label</Label>
              <Input
                id="master_name"
                placeholder="e.g. Royal Heritage Micro-Wedding"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="master_key">System Key (UPPERCASE_SNAKE_CASE)</Label>
              <Input
                id="master_key"
                placeholder="MICRO_WEDDING"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                className="border-slate-300"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="master_stages">Milestones / Parameters</Label>
              <Input
                id="master_stages"
                placeholder="Deposit: 25%, Advance: 50%, Final: 25%"
                value={newStages}
                onChange={(e) => setNewStages(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm">
                Save Option
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
