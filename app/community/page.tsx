"use client";

import { useState, useEffect } from 'react';
import { Users, MessageSquare, Award, TrendingUp, Calendar, BookOpen, Code, Heart, Star, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
    avatar?: string;
    role: string;
  };
  category: string;
  likes: number;
  replies: number;
  views: number;
  createdAt: string;
  tags: string[];
}

interface CommunityMember {
  id: string;
  name: string;
  avatar?: string;
  role: string;
  points: number;
  courses: number;
  joined: string;
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState('discussions');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockPosts: CommunityPost[] = [
      {
        id: '1',
        title: 'How to optimize React performance?',
        content: 'I&apos;m working on a large React application and noticed some performance issues...',
        author: { name: 'Sarah Chen', role: 'Student', avatar: 'https://i.pravatar.cc/150?img=1' },
        category: 'Web Development',
        likes: 24,
        replies: 8,
        views: 156,
        createdAt: '2024-01-15',
        tags: ['React', 'Performance', 'JavaScript']
      },
      {
        id: '2',
        title: 'Best practices for Python data analysis',
        content: 'What are your favorite tools and libraries for data analysis in Python?',
        author: { name: 'Mike Johnson', role: 'Teacher', avatar: 'https://i.pravatar.cc/150?img=2' },
        category: 'Data Science',
        likes: 31,
        replies: 12,
        views: 203,
        createdAt: '2024-01-14',
        tags: ['Python', 'Data Science', 'Pandas']
      },
      {
        id: '3',
        title: 'Docker vs Kubernetes for beginners',
        content: 'Can someone explain the key differences and when to use each?',
        author: { name: 'Alex Kim', role: 'Student', avatar: 'https://i.pravatar.cc/150?img=3' },
        category: 'DevOps',
        likes: 19,
        replies: 6,
        views: 127,
        createdAt: '2024-01-13',
        tags: ['Docker', 'Kubernetes', 'DevOps']
      }
    ];

    const mockMembers: CommunityMember[] = [
      {
        id: '1',
        name: 'Sarah Chen',
        avatar: 'https://i.pravatar.cc/150?img=1',
        role: 'Student',
        points: 2450,
        courses: 8,
        joined: '2023-06-15'
      },
      {
        id: '2',
        name: 'Mike Johnson',
        avatar: 'https://i.pravatar.cc/150?img=2',
        role: 'Teacher',
        points: 5200,
        courses: 15,
        joined: '2023-03-20'
      },
      {
        id: '3',
        name: 'Alex Kim',
        avatar: 'https://i.pravatar.cc/150?img=3',
        role: 'Student',
        points: 1850,
        courses: 5,
        joined: '2023-09-10'
      },
      {
        id: '4',
        name: 'Emma Davis',
        avatar: 'https://i.pravatar.cc/150?img=4',
        role: 'Student',
        points: 3100,
        courses: 10,
        joined: '2023-05-22'
      }
    ];

    setPosts(mockPosts);
    setMembers(mockMembers);
  }, []);

  const categories = [
    { id: 'all', name: 'All Topics', icon: MessageSquare },
    { id: 'webdev', name: 'Web Development', icon: Code },
    { id: 'datascience', name: 'Data Science', icon: TrendingUp },
    { id: 'devops', name: 'DevOps', icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Taxomind Community
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Connect, learn, and grow with thousands of learners and educators worldwide
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span className="font-semibold">10,000+</span>
                  <span>Members</span>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-semibold">5,000+</span>
                  <span>Discussions</span>
                </div>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  <span className="font-semibold">500+</span>
                  <span>Expert Teachers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search discussions, members, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Filter className="w-5 h-5 inline mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'discussions'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Discussions
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'members'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'text-purple-600 border-b-2 border-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            Leaderboard
          </button>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'discussions' && (
              <div className="space-y-4">
                {posts.map(post => (
                  <div key={post.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                          {post.author.avatar ? (
                            <Image
                              src={post.author.avatar}
                              alt={post.author.name}
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-bold">
                              {post.author.name[0]}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{post.author.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{post.author.role} • {post.createdAt}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 hover:text-purple-600 cursor-pointer">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{post.content}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <button className="flex items-center gap-1 hover:text-purple-600">
                        <Heart className="w-4 h-4" />
                        {post.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-purple-600">
                        <MessageSquare className="w-4 h-4" />
                        {post.replies} replies
                      </button>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {post.views} views
                      </span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      {post.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'members' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {members.map(member => (
                  <div key={member.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                        {member.avatar ? (
                          <Image
                            src={member.avatar}
                            alt={member.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                            {member.name[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">{member.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Joined {member.joined}</p>
                      </div>
                    </div>
                    <div className="flex justify-between text-center">
                      <div>
                        <p className="text-2xl font-bold text-purple-600">{member.points}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Points</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{member.courses}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Courses</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Member</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Points</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Courses</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {members.sort((a, b) => b.points - a.points).map((member, index) => (
                      <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-blue-500">
                              {member.avatar ? (
                                <Image
                                  src={member.avatar}
                                  alt={member.name}
                                  width={40}
                                  height={40}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                                  {member.name[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-semibold text-purple-600">{member.points.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg text-gray-600 dark:text-gray-400">{member.courses}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Start a Discussion */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">Start a Discussion</h3>
              <p className="text-purple-100 mb-4">Share your thoughts, ask questions, or help others</p>
              <button className="w-full bg-white text-purple-600 font-medium py-2 rounded-lg hover:bg-purple-50 transition-colors">
                Create New Post
              </button>
            </div>

            {/* Community Guidelines */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Community Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Be respectful and helpful</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Share knowledge generously</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>Keep discussions on topic</span>
                </li>
                <li className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-yellow-500 mt-0.5" />
                  <span>No spam or self-promotion</span>
                </li>
              </ul>
            </div>

            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Trending Topics</h3>
              <div className="flex flex-wrap gap-2">
                {['React', 'Python', 'Machine Learning', 'Web3', 'TypeScript', 'Docker'].map(topic => (
                  <span key={topic} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm rounded-full hover:bg-purple-200 dark:hover:bg-purple-900/50 cursor-pointer">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}