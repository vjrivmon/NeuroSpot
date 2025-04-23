import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

interface HeaderProps {
  showBackButton?: boolean
}

export function Header({ showBackButton = false }: HeaderProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <Button variant="ghost" size="icon" asChild className="mr-2">
              <Link href="/" aria-label="Volver">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative h-9 w-9">
              <Image 
                src="/logo.svg" 
                alt="NeuroSpot Logo" 
                fill 
                style={{ objectFit: 'contain' }}
                priority
              />
            </div>
            <span className="font-semibold text-lg hidden sm:inline-block">NeuroSpot</span>
          </Link>
        </div>
        <ModeToggle />
      </div>
    </header>
  )
}
