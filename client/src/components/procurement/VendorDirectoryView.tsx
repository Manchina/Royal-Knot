import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Star,
  Phone,
  Mail
} from 'lucide-react';
import {
  Card,
  CardContent,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Input,
} from '../ui';

export interface VendorItem {
  id: string;
  businessName: string;
  category: string;
  contactPerson: string | null;
  phone: string;
  email: string | null;
  city: string | null;
  ratingScore: string | number;
  bankAccountInfo?: {
    pricingEstimate?: string;
    specialties?: string;
  } | null;
}

interface VendorDirectoryViewProps {
  vendorsList: VendorItem[];
  vendorCounts: Record<string, number>;
  onAssignToWedding: (vendor: VendorItem) => void;
}

export const VendorDirectoryView: React.FC<VendorDirectoryViewProps> = ({
  vendorsList,
  vendorCounts,
}) => {
  const navigate = useNavigate();

  // Filters for Vendor Directory tab (matching Enquiry UI)
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState<string>('ALL');
  const [vendorCityFilter, setVendorCityFilter] = useState<string>('ALL');
  const [vendorSearch, setVendorSearch] = useState<string>('');

  // Filtered vendors for Directory tab (matching Enquiry-style filtering)
  const filteredVendors = useMemo(() => {
    return vendorsList.filter((v) => {
      const matchesCategory = vendorCategoryFilter === 'ALL' || v.category === vendorCategoryFilter;
      const matchesCity = vendorCityFilter === 'ALL' || (v.city && v.city.toLowerCase() === vendorCityFilter.toLowerCase());
      const matchesSearch = !vendorSearch.trim() ||
        v.businessName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        (v.city && v.city.toLowerCase().includes(vendorSearch.toLowerCase())) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(vendorSearch.toLowerCase())) ||
        v.phone.includes(vendorSearch);
      return matchesCategory && matchesCity && matchesSearch;
    });
  }, [vendorsList, vendorCategoryFilter, vendorCityFilter, vendorSearch]);

  return (
    <div className="space-y-4">
      {/* 1. Category Tabs with Live Counts (Like Pipeline Stages in Enquiries) */}
      <div className="bg-white border border-slate-200 rounded p-1.5 shadow-2xs">
        <Tabs value={vendorCategoryFilter} onValueChange={setVendorCategoryFilter} className="w-full">
          <TabsList className="h-9 bg-slate-100 border border-slate-200 w-full justify-start overflow-x-auto p-1">
            <TabsTrigger value="ALL" className="text-xs px-3 font-semibold">
              All Vendors ({vendorsList.length})
            </TabsTrigger>
            <TabsTrigger value="CATERER" className="text-xs px-3 font-semibold">
              Catering & Banquets ({vendorCounts['CATERER'] || 0})
            </TabsTrigger>
            <TabsTrigger value="DJ" className="text-xs px-3 font-semibold">
              DJ & Sound ({vendorCounts['DJ'] || 0})
            </TabsTrigger>
            <TabsTrigger value="DECORATOR" className="text-xs px-3 font-semibold">
              Palace Decor ({vendorCounts['DECORATOR'] || 0})
            </TabsTrigger>
            <TabsTrigger value="PHOTOGRAPHY" className="text-xs px-3 font-semibold">
              Photography ({vendorCounts['PHOTOGRAPHY'] || 0})
            </TabsTrigger>
            <TabsTrigger value="DRUMMERS" className="text-xs px-3 font-semibold">
              Dhol Troupe ({vendorCounts['DRUMMERS'] || 0})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 2. Filter & Search Toolbar (Matching Enquiries.tsx Filter Toolbar) */}
      <div className="bg-white border border-slate-200 rounded p-2.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search vendor name, contact person, or phone..."
            value={vendorSearch}
            onChange={(e) => setVendorSearch(e.target.value)}
            className="pl-9 h-8 text-xs border-slate-300"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* City Filter Dropdown */}
          <Select value={vendorCityFilter} onValueChange={setVendorCityFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs border-slate-300 bg-white">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Cities</SelectItem>
              <SelectItem value="Jaipur">Jaipur</SelectItem>
              <SelectItem value="Udaipur">Udaipur</SelectItem>
              <SelectItem value="Jodhpur">Jodhpur</SelectItem>
              <SelectItem value="Jaisalmer">Jaisalmer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Vendors Master Table (Matching Enquiries.tsx Table) */}
      <Card className="border border-slate-200 rounded shadow-2xs bg-white overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/80 border-b border-slate-200">
              <TableRow>
                <TableHead className="font-bold text-xs text-slate-700">Business Name & Lead</TableHead>
                <TableHead className="font-bold text-xs text-slate-700">Category</TableHead>
                <TableHead className="font-bold text-xs text-slate-700">City</TableHead>
                <TableHead className="font-bold text-xs text-slate-700">Rating</TableHead>
                <TableHead className="font-bold text-xs text-slate-700">Contact</TableHead>              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-slate-400">
                    No vendors found matching your filter criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map((v) => (
                  <TableRow
                    key={v.id}
                    onClick={() => navigate(`/procurement/vendors/${v.id}`)}
                    className="hover:bg-slate-50/75 cursor-pointer transition-colors"
                  >
                    <TableCell className="font-semibold text-xs text-slate-900">
                      <div className="hover:underline">{v.businessName}</div>
                      {v.contactPerson && (
                        <div className="text-[11px] text-slate-400 font-normal">Attn: {v.contactPerson}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-mono border-slate-200">
                        {v.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 font-medium">
                      {v.city || 'Jaipur'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-bold text-xs text-amber-700">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                        <span>{v.ratingScore}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{v.phone}</span>
                      </div>
                      {v.email && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{v.email}</span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
