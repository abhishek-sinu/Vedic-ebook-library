'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronDown, BookOpen, FolderTree } from 'lucide-react';
import { fetchBooksHierarchyTree, HierarchyCategoryNode } from '../../lib/bookStorage';

export default function LibraryTreePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tree, setTree] = useState<HierarchyCategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadTree = async () => {
      setLoading(true);
      setError('');
      const data = await fetchBooksHierarchyTree();
      if (!data.length) {
        setError('No books found in hierarchy yet.');
      }
      setTree(data);
      setLoading(false);
    };

    loadTree();
  }, []);

  useEffect(() => {
    if (!tree.length) return;

    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const subSubcategoryParam = searchParams.get('subSubcategory');

    if (!categoryParam) return;

    const findByName = <T extends { name: string }>(items: T[], name: string) =>
      items.find((item) => item.name.trim().toLowerCase() === name.trim().toLowerCase());

    const category = findByName(tree, categoryParam);
    if (!category) return;

    const categoryKey = `c:${category.name}`;
    const nextState: Record<string, boolean> = { [categoryKey]: true };

    if (subcategoryParam) {
      const subcategory = findByName(category.subcategories, subcategoryParam);
      if (subcategory) {
        const subcategoryKey = `${categoryKey}/s:${subcategory.name}`;
        nextState[subcategoryKey] = true;

        if (subSubcategoryParam) {
          const subSubcategory = findByName(subcategory.subSubcategories, subSubcategoryParam);
          if (subSubcategory) {
            const subSubKey = `${subcategoryKey}/ss:${subSubcategory.name}`;
            nextState[subSubKey] = true;
          }
        }
      }
    }

    setExpanded((prev) => ({ ...prev, ...nextState }));
  }, [tree, searchParams]);

  const totalBooks = useMemo(() => {
    let count = 0;
    tree.forEach((category) => {
      category.subcategories.forEach((subcategory) => {
        count += subcategory.books.length;
        subcategory.subSubcategories.forEach((node) => {
          count += node.books.length;
        });
      });
    });
    return count;
  }, [tree]);

  const setBranchState = (keys: string[], isOpen: boolean) => {
    setExpanded((prev) => {
      const next = { ...prev };
      keys.forEach((key) => {
        next[key] = isOpen;
      });
      return next;
    });
  };

  const toggleNode = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCategoryBranch = (category: HierarchyCategoryNode) => {
    const categoryKey = `c:${category.name}`;
    const branchKeys: string[] = [categoryKey];

    category.subcategories.forEach((subcategory) => {
      const subcategoryKey = `${categoryKey}/s:${subcategory.name}`;
      branchKeys.push(subcategoryKey);

      subcategory.subSubcategories.forEach((subSub) => {
        branchKeys.push(`${subcategoryKey}/ss:${subSub.name}`);
      });
    });

    const shouldOpen = !branchKeys.every((key) => !!expanded[key]);
    setBranchState(branchKeys, shouldOpen);
  };

  const toggleSubcategoryBranch = (categoryName: string, subcategory: HierarchyCategoryNode['subcategories'][number]) => {
    const categoryKey = `c:${categoryName}`;
    const subcategoryKey = `${categoryKey}/s:${subcategory.name}`;
    const branchKeys: string[] = [categoryKey, subcategoryKey];

    subcategory.subSubcategories.forEach((subSub) => {
      branchKeys.push(`${subcategoryKey}/ss:${subSub.name}`);
    });

    const shouldOpen = !branchKeys.every((key) => !!expanded[key]);
    setBranchState(branchKeys, shouldOpen);
  };

  const openBook = (bookId: string) => {
    router.push(`/?bookId=${bookId}`);
  };

  return (
    <div className="min-h-screen p-6 md:p-10" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FolderTree className="w-6 h-6" style={{ color: 'var(--icon)' }} />
            <h1 className="text-2xl font-bold">Library Tree</h1>
          </div>
          <div className="text-sm opacity-80">{totalBooks} books</div>
        </div>

        {loading && <div className="p-4 rounded-lg" style={{ background: 'var(--card)' }}>Loading tree...</div>}

        {!loading && error && tree.length === 0 && (
          <div className="p-4 rounded-lg" style={{ background: 'var(--card)' }}>{error}</div>
        )}

        {!loading && tree.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {tree.map((category) => {
              const categoryKey = `c:${category.name}`;
              const categoryOpen = !!expanded[categoryKey];

              return (
                <div key={category.name} style={{ borderBottom: '1px solid var(--border)' }}>
                  <button
                    onClick={() => toggleCategoryBranch(category)}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left"
                    style={{ background: 'transparent' }}
                  >
                    {categoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-semibold">{category.name}</span>
                  </button>

                  {categoryOpen && (
                    <div className="pb-2">
                      {category.subcategories.map((subcategory) => {
                        const subcategoryKey = `${categoryKey}/s:${subcategory.name}`;
                        const subcategoryOpen = !!expanded[subcategoryKey];

                        return (
                          <div key={subcategoryKey} className="pl-7">
                            <button
                              onClick={() => toggleSubcategoryBranch(category.name, subcategory)}
                              className="w-full flex items-center gap-2 px-4 py-2 text-left"
                              style={{ background: 'transparent' }}
                            >
                              {subcategoryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              <span>{subcategory.name}</span>
                            </button>

                            {subcategoryOpen && (
                              <div className="pl-7 pb-2">
                                {subcategory.books.map((book) => (
                                  <button
                                    key={book._id}
                                    onClick={() => openBook(book._id)}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-left rounded-md"
                                    style={{ background: 'transparent' }}
                                  >
                                    <BookOpen className="w-4 h-4" style={{ color: 'var(--icon)' }} />
                                    <span className="font-medium">{book.title}</span>
                                  </button>
                                ))}

                                {subcategory.subSubcategories.map((subSub) => {
                                  const subSubKey = `${subcategoryKey}/ss:${subSub.name}`;
                                  const subSubOpen = !!expanded[subSubKey];

                                  return (
                                    <div key={subSubKey} className="pl-5">
                                      <button
                                        onClick={() => toggleNode(subSubKey)}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-left"
                                        style={{ background: 'transparent' }}
                                      >
                                        {subSubOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        <span>{subSub.name}</span>
                                      </button>

                                      {subSubOpen && (
                                        <div className="pl-6 pb-2">
                                          {subSub.books.map((book) => (
                                            <button
                                              key={book._id}
                                              onClick={() => openBook(book._id)}
                                              className="w-full flex items-center gap-2 px-4 py-2 text-left rounded-md"
                                              style={{ background: 'transparent' }}
                                            >
                                              <BookOpen className="w-4 h-4" style={{ color: 'var(--icon)' }} />
                                              <span className="font-medium">{book.title}</span>
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
