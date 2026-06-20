import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JobQueryDto } from './dto/job-query.dto';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  /** Paginated, filtered list of open job postings for candidates to browse. */
  async findAll(query: JobQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.JobPostingWhereInput = { status: 'OPEN' };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { descriptionText: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' };
    }

    if (query.skills?.length) {
      // targetSkills is a JSON array; require every requested skill to be present.
      where.AND = query.skills.map((skill) => ({
        targetSkills: { array_contains: skill },
      }));
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.jobPosting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: {
            select: { id: true, name: true, industry: true },
          },
        },
      }),
      this.prisma.jobPosting.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const job = await this.prisma.jobPosting.findUnique({
      where: { id },
      include: {
        organization: {
          select: { id: true, name: true, industry: true, websiteUrl: true },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Job posting not found');
    }

    return job;
  }
}
