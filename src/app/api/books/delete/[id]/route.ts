import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookId } = await params;
    const booksDir = path.join(process.cwd(), 'public', 'books');
    
    // Find and delete metadata file and book file
    const files = fs.readdirSync(booksDir);
    let deleted = false;
    
    for (const file of files) {
      if (file.endsWith('.meta.json')) {
        const metadataPath = path.join(booksDir, file);
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
        
        if (metadata.id === bookId) {
          // Delete book file
          const bookPath = path.join(booksDir, metadata.filename);
          if (fs.existsSync(bookPath)) {
            fs.unlinkSync(bookPath);
          }
          
          // Delete metadata file
          fs.unlinkSync(metadataPath);
          deleted = true;
          break;
        }
      }
    }

    if (!deleted) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Book deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting book:', error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}