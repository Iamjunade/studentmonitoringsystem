import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { MOCK_STUDENTS } from './components/constants';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("Starting DB seed...");

    // Clear existing data to avoid duplicates if run multiple times
    await prisma.academicDetail.deleteMany();
    await prisma.attendance.deleteMany();
    await prisma.student.deleteMany();

    for (const student of MOCK_STUDENTS) {
        const createdStudent = await prisma.student.create({
            data: {
                name: student.name,
                rollNumber: student.rollNumber,
                email: student.email,
                parentName: student.parentName,
                parentPhone: student.parentPhone,
                studentPhone: student.studentPhone,
                grade: student.grade,
                section: student.section,
                avatar: student.avatar,
                attendancePercentage: student.attendancePercentage,
                gpa: student.gpa,
            },
        });

        for (const detail of student.academicDetails) {
            await prisma.academicDetail.create({
                data: {
                    studentId: createdStudent.id,
                    subject: detail.subject,
                    grade: detail.grade,
                    score: detail.score,
                }
            });
        }

        console.log(`Seeded student: ${student.name}`);
    }

    console.log("Seeding finished.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
