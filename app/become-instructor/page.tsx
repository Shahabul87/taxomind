import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { BecomeInstructorForm } from "./_components/become-instructor-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, DollarSign, Award, Target, Zap } from "lucide-react";

export default async function BecomeInstructorPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // If already a teacher, redirect to dashboard
  // TODO: Implement teacher check when isTeacher field is added to User model
  // if (user.isTeacher) {
  //   redirect("/dashboard?tab=teaching");
  // }

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Become an Instructor on Taxomind
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Share your knowledge with millions of students around the world and earn money while making a difference.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <Users className="h-10 w-10 text-primary mb-2" />
            <CardTitle>Reach Students Globally</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Connect with learners from all over the world who are eager to gain new skills.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <DollarSign className="h-10 w-10 text-primary mb-2" />
            <CardTitle>Earn Money</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Set your own prices and earn revenue every time a student enrolls in your course.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Award className="h-10 w-10 text-primary mb-2" />
            <CardTitle>Build Your Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Establish yourself as an expert in your field and grow your professional reputation.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl">How It Works</CardTitle>
          <CardDescription>
            Start teaching in three simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Apply to Become an Instructor</h3>
                <p className="text-muted-foreground">
                  Fill out the form below with your expertise and teaching interests.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Create Your First Course</h3>
                <p className="text-muted-foreground">
                  Use our intuitive course builder to create engaging content with videos, quizzes, and assignments.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Start Earning</h3>
                <p className="text-muted-foreground">
                  Publish your course and start earning as students enroll. We handle payments and provide analytics.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Instructor Application
          </CardTitle>
          <CardDescription>
            Tell us about yourself and what you&apos;d like to teach
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BecomeInstructorForm userId={user.id!} />
        </CardContent>
      </Card>

      {/* Support Section */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Have questions about becoming an instructor?{" "}
          <a href="/support" className="text-primary hover:underline">
            Contact our support team
          </a>
        </p>
      </div>
    </div>
  );
}