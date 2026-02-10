from django.core.management.base import BaseCommand
from api.models import Specialty
from api.constants import CORE_SPECIALTIES

class Command(BaseCommand):
    help = '''
    Clean up database specialties.
    
    NOTE: Core specialties are now hardcoded in api.constants.CORE_SPECIALTIES
    and no longer need to be stored in the database.
    
    This command removes old predefined specialties from the database since
    they are now handled in code. Only custom specialties (requested via "Other")
    remain in the database.
    '''

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Cleaning up specialty database...'))
        
        # Remove old predefined specialties from database
        # Core specialties are now hardcoded in constants.py
        deleted_count = Specialty.objects.filter(is_predefined=True).count()
        
        if deleted_count > 0:
            Specialty.objects.filter(is_predefined=True).delete()
            self.stdout.write(self.style.SUCCESS(f'  Removed {deleted_count} old predefined specialties from database'))
        else:
            self.stdout.write(self.style.SUCCESS('  No old predefined specialties to remove'))
        
        # Show current custom specialties
        custom_count = Specialty.objects.filter(is_predefined=False).count()
        self.stdout.write(self.style.SUCCESS(f'  Custom specialties in database: {custom_count}'))
        
        # Show core specialties count
        self.stdout.write(self.style.SUCCESS(f'  Core specialties (hardcoded): {len(CORE_SPECIALTIES)}'))
        
        self.stdout.write(self.style.SUCCESS(f'\nCompleted!'))
        self.stdout.write(self.style.NOTICE('\nCore specialties are now managed in code (api/constants.py)'))
        self.stdout.write(self.style.NOTICE('Database only stores custom specialties requested by doctors.'))
