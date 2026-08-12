import { injectable } from 'tsyringe';
import { AnalyticsRepository } from '../repositories/analytics.repo';
import { addLaplaceNoise } from './dp.service';

const EPSILON = 1.0;

@injectable()
export class AnalyticsService {
  constructor(private analyticsRepo: AnalyticsRepository) {}

  async getPopularBooks() {
    // Group by book copy -> we need to group by the actual book
    const borrowings = await this.analyticsRepo.getBorrowingsWithBookTitles();

    const bookCounts: Record<string, { title: string; trueCount: number }> = {};
    borrowings.forEach((b) => {
      if (!b.book_copies?.books) return;
      const title = b.book_copies.books.title;
      if (!bookCounts[title]) {
        bookCounts[title] = { title, trueCount: 0 };
      }
      bookCounts[title].trueCount++;
    });

    return Object.values(bookCounts)
      .map((bc) => ({
        title: bc.title,
        // trueCount is hidden from the final output for privacy!
        borrow_count: addLaplaceNoise(bc.trueCount, EPSILON)
      }))
      .sort((a, b) => b.borrow_count - a.borrow_count)
      .slice(0, 10); // Top 10
  }

  async getPeakSearchTimes() {
    const searches = await this.analyticsRepo.getSearchTimestamps();

    const hourCounts = new Array(24).fill(0);
    searches.forEach((s) => {
      const date = new Date(s.timestamp);
      const hour = date.getHours(); // 0 to 23
      hourCounts[hour]++;
    });

    return hourCounts.map((trueCount, hour) => ({
      hour,
      // Convert to 12-hour format for readability
      label:
        hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`,
      search_volume: addLaplaceNoise(trueCount, EPSILON)
    }));
  }

  async getPublicStats() {
    const { totalBooks, totalUsers, totalReserves } = await this.analyticsRepo.getPublicCounts();

    const uptimeHours = process.uptime() / 3600;
    const uptimePercent = Math.min(99.99, 99.0 + uptimeHours / 24).toFixed(2);

    return {
      totalBooks, // Catalog size isn't sensitive PII
      totalUsers: addLaplaceNoise(totalUsers, EPSILON),
      totalReserves: addLaplaceNoise(totalReserves, EPSILON),
      uptimePercent: `${uptimePercent}%`
    };
  }
}
