// Module 1: Data Ingestion - Images, CSV, Manual Entry
import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, Edit3, Trash2, Check, FileText, FileJson, Sparkles } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import { getStorageGateway } from '@/services/storage-adapter';
import { getAIGateway } from '@/services/ai-provider';
import type { DashboardData, DataSource } from '@/types';

export function DataIngestion() {
  const { currentProject, setCurrentStage, updateProject } = useProjectStore();
  const { generate } = useAIGeneration();

  const [activeTab, setActiveTab] = useState('images');
  const [uploadedImages, setUploadedImages] = useState<{ file: File; preview: string; id?: string }[]>([]);
  const [csvData, setCsvData] = useState<DashboardData[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [manualData, setManualData] = useState<DashboardData>({});
  const [localIsGenerating, setLocalIsGenerating] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const storage = getStorageGateway();
  
  // Load from store on mount
  useEffect(() => {
    if (currentProject?.dataSource) {
      if (currentProject.dataSource.type === 'images' && Array.isArray(currentProject.dataSource.rawData)) {
        const firstItem = currentProject.dataSource.rawData[0] as any;
        if (firstItem?.analysis) {
          setAnalysisResult(firstItem.analysis);
        }
      } else if (currentProject.dataSource.type === 'csv') {
        const data = currentProject.dataSource.rawData as DashboardData[];
        setCsvData(data.slice(0, 10));
        if (data.length > 0) {
          setCsvHeaders(Object.keys(data[0]));
        }
      } else if (currentProject.dataSource.type === 'manual') {
        setManualData(currentProject.dataSource.rawData as DashboardData);
      }
    }
  }, []);

  // Image dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: 5
  });

  const removeImage = (index: number) => {
    setUploadedImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const processImages = async () => {
    if (localIsGenerating) return;
    setLocalIsGenerating(true);
    const ai = getAIGateway();

    try {
      const processedResults = [];
      const base64Images: string[] = [];

      for (const img of uploadedImages) {
        const result = await storage.uploadImage(img.file);
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(img.file);
        });
        
        base64Images.push(base64);
        processedResults.push({ ...img, id: result.id });
      }
      
      setUploadedImages(processedResults);
      
      let analysisData: any[] = processedResults.map(u => ({ name: u.file.name }));
      
      if (ai.isAvailable() && base64Images.length > 0) {
        toast.info('Analyzing images...');
        const response = await generate({
          prompt: "Analyze these YouTube analytics screenshots. Extracted insights?",
          type: 'text',
          images: base64Images
        });
        
        if (response.success) {
          analysisData = [{ analysis: response.data }];
          setAnalysisResult(response.data);
          toast.success('Analysis complete');
        }
      }
      
      const dataSource: DataSource = {
        type: 'images',
        rawData: analysisData,
        processedAt: new Date()
      };
      updateProject({ dataSource });
      
    } catch (error) {
      toast.error('Processing failed');
    } finally {
      setLocalIsGenerating(false);
    }
  };

  // CSV handling
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as DashboardData[];
        setCsvData(data.slice(0, 10)); // Preview first 10 rows
        setCsvHeaders(results.meta.fields || []);
        
        // Save to project
        const dataSource: DataSource = {
          type: 'csv',
          rawData: data,
          processedAt: new Date()
        };
        updateProject({ dataSource });
        
        toast.success(`CSV parsed: ${data.length} rows`);
      },
      error: (error) => {
        toast.error(`CSV parse error: ${error.message}`);
      }
    });
  };

  const handleManualSubmit = () => {
    const dataSource: DataSource = {
      type: 'manual',
      rawData: manualData,
      processedAt: new Date()
    };
    updateProject({ dataSource });
    toast.success('Manual data saved');
  };

  const downloadData = (format: 'csv' | 'json' | 'txt') => {
    if (!analysisResult) return;
    
    let content = analysisResult;
    let mimeType = 'text/plain';
    
    if (format === 'json') {
      content = JSON.stringify({ analysis: analysisResult }, null, 2);
      mimeType = 'application/json';
    } else if (format === 'csv') {
      content = `"Analysis"\n"${analysisResult.replace(/"/g, '""')}"`;
      mimeType = 'text/csv';
    }
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_result.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const canProceed = currentProject?.dataSource !== null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Data Ingestion</h2>
          <p className="text-muted-foreground mt-1">
            Import your analytics data to generate content ideas
          </p>
        </div>
        {canProceed && (
          <Button 
            onClick={() => {
              updateProject({ topicSuggestions: [] });
              setCurrentStage('topics');
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
          >
            Continue to Topics
            <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-muted">
          <TabsTrigger value="images" className="data-[state=active]:bg-background">
            <Upload className="mr-2 h-4 w-4" />
            Images
          </TabsTrigger>
          <TabsTrigger value="csv" className="data-[state=active]:bg-background">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            CSV
          </TabsTrigger>
          <TabsTrigger value="manual" className="data-[state=active]:bg-background">
            <Edit3 className="mr-2 h-4 w-4" />
            Manual
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="mt-6">
          <Card className="bg-card border-border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="font-sans text-foreground">Upload Dashboard Screenshots</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload 2-3 screenshots of your YouTube Analytics dashboard for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-foreground font-medium">
                  {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to select files (PNG, JPG, WebP)
                </p>
              </div>

              {uploadedImages.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {uploadedImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img.preview}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border border-border"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full
                                     opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {img.id && (
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                            Uploaded
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={processImages}
                    disabled={localIsGenerating || uploadedImages.every(img => img.id)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {localIsGenerating ? 'Processing...' : 'Process Images'}
                  </Button>
                </div>
              )}

              {/* Analysis Result & Downloads */}
              {analysisResult && (
                <div className="mt-6 border rounded-lg overflow-hidden bg-muted/30">
                  <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="font-medium text-sm">AI Analysis Result</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" title="Download Text" onClick={() => downloadData('txt')}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download JSON" onClick={() => downloadData('json')}>
                        <FileJson className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Download CSV" onClick={() => downloadData('csv')}>
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 max-h-60 overflow-y-auto text-sm text-foreground/80 font-mono whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                </div>
              )}

              {/* Manual input fallback */}
              <div className="border-t border-border pt-4 mt-4">
                <p className="text-sm text-muted-foreground mb-3">
                  Or enter data manually if AI vision is unavailable:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-sans text-foreground">Video Title</Label>
                    <Input 
                      placeholder="Enter video title"
                      className="bg-input border-input"
                      onChange={(e) => setManualData(prev => ({ ...prev, videoTitle: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-foreground">Views</Label>
                    <Input 
                      type="number"
                      placeholder="e.g. 10000"
                      className="bg-input border-input"
                      onChange={(e) => setManualData(prev => ({ ...prev, views: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-foreground">CTR (%)</Label>
                    <Input 
                      type="number"
                      step="0.1"
                      placeholder="e.g. 5.2"
                      className="bg-input border-input"
                      onChange={(e) => setManualData(prev => ({ ...prev, ctr: parseFloat(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label className="font-sans text-foreground">Avg Duration</Label>
                    <Input 
                      placeholder="e.g. 3:45"
                      className="bg-input border-input"
                      onChange={(e) => setManualData(prev => ({ ...prev, avgViewDuration: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CSV Tab */}
        <TabsContent value="csv" className="mt-6">
          <Card className="bg-card border-border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="font-sans text-foreground">Upload CSV Data</CardTitle>
              <CardDescription className="text-muted-foreground">
                Import your YouTube Analytics CSV export
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="bg-input border-input"
                />
              </div>

              {csvData.length > 0 && (
                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-64 overflow-auto">
                    <Table>
                      <TableHeader className="bg-muted sticky top-0">
                        <TableRow>
                          {csvHeaders.map((header, i) => (
                            <TableHead key={i} className="font-sans text-foreground whitespace-nowrap">
                              {header}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {csvData.map((row, i) => (
                          <TableRow key={i}>
                            {csvHeaders.map((header, j) => (
                              <TableCell key={j} className="text-muted-foreground whitespace-nowrap">
                                {String(row[header] || '').substring(0, 50)}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="bg-muted px-4 py-2 text-sm text-muted-foreground">
                    Showing {csvData.length} rows (preview)
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual" className="mt-6">
          <Card className="bg-card border-border rounded-lg shadow-sm">
            <CardHeader>
              <CardTitle className="font-sans text-foreground">Manual Data Entry</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your video performance metrics manually
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-sans text-foreground">Video Title</Label>
                  <Input 
                    placeholder="Your video title"
                    className="bg-input border-input"
                    value={manualData.videoTitle || ''}
                    onChange={(e) => setManualData(prev => ({ ...prev, videoTitle: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-foreground">Views</Label>
                  <Input 
                    type="number"
                    placeholder="Total views"
                    className="bg-input border-input"
                    value={manualData.views || ''}
                    onChange={(e) => setManualData(prev => ({ ...prev, views: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-foreground">Impressions</Label>
                  <Input 
                    type="number"
                    placeholder="Total impressions"
                    className="bg-input border-input"
                    value={manualData.impressions || ''}
                    onChange={(e) => setManualData(prev => ({ ...prev, impressions: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-foreground">CTR (%)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    placeholder="Click-through rate"
                    className="bg-input border-input"
                    value={manualData.ctr || ''}
                    onChange={(e) => setManualData(prev => ({ ...prev, ctr: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-foreground">Average View Duration</Label>
                  <Input 
                    placeholder="e.g. 3:45"
                    className="bg-input border-input"
                    value={manualData.avgViewDuration || ''}
                    onChange={(e) => setManualData(prev => ({ ...prev, avgViewDuration: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="font-sans text-foreground">Watch Time (hours)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    placeholder="Total watch time"
                    className="bg-input border-input"
                    value={manualData.watchTime || ''}
                    onChange={(e) => setManualData(prev => ({ ...prev, watchTime: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleManualSubmit}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
