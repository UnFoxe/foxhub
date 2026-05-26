// app/page.tsx

import Link from "next/link";
import { Metadata } from "next";
import Image from "next/image";

// Page metadata
export const metadata: Metadata = {
  title: "My Next.js Page",
  description: "A beautiful example page built with Next.js",
};

// Mock data fetching
async function fetchPosts() {
  // In a real app, you'd use fetch or axios
  return [
    { id: 1, title: "Post One", content: "Lorem ipsum dolor sit amet..." },
    { id: 2, title: "Post Two", content: "Consectetur adipiscing elit..." },
    { id: 3, title: "Post Three", content: "Sed do eiusmod tempor..." },
  ];
}

// Main component
export default async function HomePage() {
  const posts = await fetchPosts();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              MyBrand
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/about" className="text-gray-700 hover:text-blue-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
            Welcome to Next.js
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Build fast, modern web applications with the React framework the reading comprehension.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/features" className="bg-blue-600 text-white px-8 py-3 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Get Started
            </Link>
            <Link href="/pricing" className="bg-white text-gray-700 border-2 border-gray-200 px-8 py-3 rounded-xl text-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition-all">
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Next.js?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "🚀", title: "Fast Performance", desc: "Optimized for speed with React Server Components" },
              { icon: "🔒", title: "Secure by Default", desc: "Built-in security features and best practices" },
              { icon: "🎨", title: "Great DX", desc: "Developer experience with hot reloading and type safety" },
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">
            Recent Posts
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article 
                key={post.id}
                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                  <Image 
                    src="/placeholder.svg"
                    alt={post.title}
                    width={300}
                    height={200}
                    className="opacity-50"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                  <p className="text-gray-600 line-clamp-2">{post.content}</p>
                  <Link href={`/posts/${post.id}`} className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium">
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Subscribe to Our Newsletter</h2>
          <p className="mb-8 opacity-90">Get the latest updates and tutorials directly to your inbox.</p>
          <form className="flex gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-6 py-3 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button 
              type="submit"
              className="bg-white text-blue-600 px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-white text-lg font-bold mb-4">MyBrand</h3>
              <p className="text-sm">Building amazing web experiences with Next.js.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Follow Us</h4>
              <div className="flex gap-4">
                {["Twitter", "GitHub", "LinkedIn"].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors"
                  >
                    {social.charAt(0)}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 MyBrand. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
