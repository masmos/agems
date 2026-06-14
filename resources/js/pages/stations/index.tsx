import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { MonitoringStation, PaginatedResponse } from '@/types';

interface StationsIndexProps {
  stations: PaginatedResponse<MonitoringStation>;
}

const StationsIndex: React.FC<StationsIndexProps> = ({ stations }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const filteredStations = stations.data.filter(station =>
    station.station_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const getStatusColor = (status: MonitoringStation['status']): string => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'offline': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const handlePageChange = (url: string | null) => {
    if (url) {
      router.visit(url);
    }
  };
  
  return (
    <>
      <Head title="Monitoring Stations" />
      
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Monitoring Stations</h1>
            <button className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Station
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-4">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search stations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {/* Stations Grid */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStations.map((station) => (
              <StationCard 
                key={station.id} 
                station={station} 
                statusColor={getStatusColor(station.status)} 
              />
            ))}
          </div>
          
          {/* Pagination */}
          {stations.total > stations.per_page && (
            <div className="mt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {stations.from} to {stations.to} of {stations.total} results
                </div>
                <div className="flex space-x-2">
                  {stations.links.map((link, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(link.url)}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                      className={`px-3 py-1 rounded ${
                        link.active
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      disabled={!link.url}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

interface StationCardProps {
  station: MonitoringStation;
  statusColor: string;
}

const StationCard: React.FC<StationCardProps> = ({ station, statusColor }) => {
  return (
    <Link href={`/stations/${station.id}`}>
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">{station.station_name}</h3>
            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor}`}>
              {station.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">{station.location}</p>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-gray-500">Alerts: {station.alerts_count || 0}</span>
            <span className="text-gray-500">
              Last active: {new Date(station.updated_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default StationsIndex;