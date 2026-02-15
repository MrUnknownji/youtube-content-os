import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Sparkles,
  Target,
  TrendingUp,
  Calendar,
  Clock,
  Save,
  RefreshCw,
  Lightbulb,
  Heart,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useProjectStore } from '@/state/projectStore';
import { useAIGeneration } from '@/hooks/useAIGeneration';
import type { CreatorProfile } from '@/types';

const DEFAULT_PROFILE: CreatorProfile = {
  id: 'creator-1',
  name: '',
  niche: '',
  toneOfVoice: [],
  contentPillars: [],
  audiencePersona: '',
  brandKeywords: [],
  postingSchedule: {
    preferredDays: [],
    preferredTimes: [],
    shortsFrequency: 'daily'
  },
  contentGoals: [],
  uniqueSellingPoint: ''
};

export function CreatorProfileSetup() {
  const { currentProject, updateProject } = useProjectStore();
  const { generate } = useAIGeneration();

  const [profile, setProfile] = useState<CreatorProfile>(() => {
    return currentProject?.creatorProfile || DEFAULT_PROFILE;
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const saveProfile = () => {
    updateProject({ creatorProfile: profile });
    toast.success('Creator profile saved');
  };

  const analyzeAndSuggest = async () => {
    if (!profile.niche) {
      toast.error('Please enter your niche first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = `You are a YouTube content strategy expert. Based on this creator's niche: "${profile.niche}"

${profile.name ? `Creator Name: ${profile.name}` : ''}
${profile.audiencePersona ? `Target Audience: ${profile.audiencePersona}` : ''}
${profile.contentGoals.length > 0 ? `Goals: ${profile.contentGoals.join(', ')}` : ''}

Suggest a complete content strategy in JSON format:
{
  "toneOfVoice": ["3-5 tone descriptors like 'energetic', 'relatable', 'authoritative'"],
  "contentPillars": ["3-4 main content themes"],
  "brandKeywords": ["8-10 keywords that define the brand"],
  "uniqueSellingPoint": "What makes this creator unique",
  "postingSchedule": {
    "preferredDays": ["best 3-4 days to post"],
    "preferredTimes": ["best times in IST"],
    "shortsFrequency": "recommended shorts frequency"
  },
  "contentSuggestions": ["3 specific video ideas for this creator"]
}

Return only valid JSON.`;

      const response = await generate({ prompt, type: 'text', format: 'json' });
      
      if (response.success) {
        try {
          const jsonMatch = response.data.match(/\{[\s\S]*\}/);
          const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(response.data);
          
          setProfile(prev => ({
            ...prev,
            toneOfVoice: suggestions.toneOfVoice || prev.toneOfVoice,
            contentPillars: suggestions.contentPillars || prev.contentPillars,
            brandKeywords: suggestions.brandKeywords || prev.brandKeywords,
            uniqueSellingPoint: suggestions.uniqueSellingPoint || prev.uniqueSellingPoint,
            postingSchedule: suggestions.postingSchedule || prev.postingSchedule
          }));
          toast.success('Profile suggestions generated');
        } catch {
          toast.error('Failed to parse suggestions');
        }
      }
    } catch {
      toast.error('Failed to generate suggestions');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addTone = (tone: string) => {
    if (!profile.toneOfVoice.includes(tone)) {
      setProfile(prev => ({
        ...prev,
        toneOfVoice: [...prev.toneOfVoice, tone]
      }));
    }
  };

  const removeTone = (tone: string) => {
    setProfile(prev => ({
      ...prev,
      toneOfVoice: prev.toneOfVoice.filter(t => t !== tone)
    }));
  };

  const addKeyword = (keyword: string) => {
    if (!profile.brandKeywords.includes(keyword)) {
      setProfile(prev => ({
        ...prev,
        brandKeywords: [...prev.brandKeywords, keyword]
      }));
    }
  };

  const removeKeyword = (keyword: string) => {
    setProfile(prev => ({
      ...prev,
      brandKeywords: prev.brandKeywords.filter(k => k !== keyword)
    }));
  };

  const suggestedTones = ['Energetic', 'Relatable', 'Authoritative', 'Humorous', 'Inspirational', 'Educational', 'Casual', 'Professional'];
  const suggestedPillars = ['Tutorials', 'Behind-the-scenes', 'Reviews', 'Tips & Tricks', 'Personal Stories', 'Trending Topics', 'Q&A', 'Challenges'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold font-sans text-foreground">Creator Profile</h2>
          <p className="text-muted-foreground mt-1">
            Define your brand voice for consistent, engaging content
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={analyzeAndSuggest}
            disabled={isAnalyzing || !profile.niche}
            variant="outline"
            className="border-border"
          >
            {isAnalyzing ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            AI Suggestions
          </Button>
          <Button
            onClick={saveProfile}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground">Creator/Channel Name</Label>
              <Input
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your channel name"
                className="bg-input border-input mt-1"
              />
            </div>
            <div>
              <Label className="text-foreground">Niche</Label>
              <Input
                value={profile.niche}
                onChange={(e) => setProfile(prev => ({ ...prev, niche: e.target.value }))}
                placeholder="e.g., Tech tutorials, Productivity, Gaming"
                className="bg-input border-input mt-1"
              />
            </div>
            <div>
              <Label className="text-foreground">Target Audience</Label>
              <Textarea
                value={profile.audiencePersona}
                onChange={(e) => setProfile(prev => ({ ...prev, audiencePersona: e.target.value }))}
                placeholder="Describe your ideal viewer: age, interests, pain points..."
                className="bg-input border-input mt-1 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-foreground">Unique Selling Point</Label>
              <Textarea
                value={profile.uniqueSellingPoint}
                onChange={(e) => setProfile(prev => ({ ...prev, uniqueSellingPoint: e.target.value }))}
                placeholder="What makes you different from other creators in your niche?"
                className="bg-input border-input mt-1 min-h-[60px]"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Tone of Voice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Selected Tones</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.toneOfVoice.map((tone) => (
                  <Badge
                    key={tone}
                    className="cursor-pointer hover:bg-destructive"
                    onClick={() => removeTone(tone)}
                  >
                    {tone} ×
                  </Badge>
                ))}
                {profile.toneOfVoice.length === 0 && (
                  <span className="text-sm text-muted-foreground">Click suggestions below to add</span>
                )}
              </div>
            </div>
            <div>
              <Label className="text-foreground mb-2 block">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedTones.map((tone) => (
                  <Badge
                    key={tone}
                    variant={profile.toneOfVoice.includes(tone) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => addTone(tone)}
                  >
                    + {tone}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Content Pillars
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Main Content Themes</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.contentPillars.map((pillar) => (
                  <Badge
                    key={pillar}
                    className="cursor-pointer hover:bg-destructive"
                    onClick={() => setProfile(prev => ({
                      ...prev,
                      contentPillars: prev.contentPillars.filter(p => p !== pillar)
                    }))}
                  >
                    {pillar} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-foreground mb-2 block">Suggestions</Label>
              <div className="flex flex-wrap gap-2">
                {suggestedPillars.map((pillar) => (
                  <Badge
                    key={pillar}
                    variant={profile.contentPillars.includes(pillar) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (!profile.contentPillars.includes(pillar)) {
                        setProfile(prev => ({
                          ...prev,
                          contentPillars: [...prev.contentPillars, pillar]
                        }));
                      }
                    }}
                  >
                    + {pillar}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Brand Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-foreground mb-2 block">Keywords that define your brand</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {profile.brandKeywords.map((keyword) => (
                  <Badge
                    key={keyword}
                    variant="secondary"
                    className="cursor-pointer hover:bg-destructive"
                    onClick={() => removeKeyword(keyword)}
                  >
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add keyword"
                className="bg-input border-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addKeyword((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Posting Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-foreground mb-2 block">Preferred Days</Label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <Badge
                      key={day}
                      variant={profile.postingSchedule.preferredDays.includes(day) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          postingSchedule: {
                            ...prev.postingSchedule,
                            preferredDays: prev.postingSchedule.preferredDays.includes(day)
                              ? prev.postingSchedule.preferredDays.filter(d => d !== day)
                              : [...prev.postingSchedule.preferredDays, day]
                          }
                        }));
                      }}
                    >
                      {day.slice(0, 3)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-foreground mb-2 block">Preferred Times (IST)</Label>
                <div className="flex flex-wrap gap-2">
                  {['6-8 AM', '12-2 PM', '4-6 PM', '7-9 PM', '9-11 PM'].map((time) => (
                    <Badge
                      key={time}
                      variant={profile.postingSchedule.preferredTimes.includes(time) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          postingSchedule: {
                            ...prev.postingSchedule,
                            preferredTimes: prev.postingSchedule.preferredTimes.includes(time)
                              ? prev.postingSchedule.preferredTimes.filter(t => t !== time)
                              : [...prev.postingSchedule.preferredTimes, time]
                          }
                        }));
                      }}
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      {time}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-foreground mb-2 block">Shorts Frequency</Label>
                <div className="flex flex-wrap gap-2">
                  {['daily', '3-4/week', '2/week', 'weekly'].map((freq) => (
                    <Badge
                      key={freq}
                      variant={profile.postingSchedule.shortsFrequency === freq ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        setProfile(prev => ({
                          ...prev,
                          postingSchedule: {
                            ...prev.postingSchedule,
                            shortsFrequency: freq
                          }
                        }));
                      }}
                    >
                      {freq}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Content Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['Grow Subscribers', 'Increase Watch Time', 'Build Community', 'Monetize', 'Brand Deals', 'Educate Audience', 'Entertain', 'Go Viral'].map((goal) => (
                <Badge
                  key={goal}
                  variant={profile.contentGoals.includes(goal) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => {
                    setProfile(prev => ({
                      ...prev,
                      contentGoals: prev.contentGoals.includes(goal)
                        ? prev.contentGoals.filter(g => g !== goal)
                        : [...prev.contentGoals, goal]
                    }));
                  }}
                >
                  {goal}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-secondary/50 border-secondary">
        <CardContent className="pt-4">
          <h4 className="text-sm font-sans font-medium flex items-center gap-2 mb-3">
            <Heart className="h-4 w-4" />
            Why This Matters
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Your profile helps AI generate content that matches YOUR unique voice</li>
            <li>• Consistent tone builds audience trust and recognition</li>
            <li>• Content pillars ensure variety while staying on-brand</li>
            <li>• Optimized posting times maximize reach and engagement</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
